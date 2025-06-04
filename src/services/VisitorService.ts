import { Op } from 'sequelize';
import moment from 'moment';
import VisitorPass from '../models/VisitorPass';
import User from '../models/User';
import Society from '../models/Society';
import Flat from '../models/Flat';
import { VisitorPassStatus, UserRole } from '../types';
import { generateOTP, formatPhoneNumber, isWithinValidity } from '../utils/helpers';
import { sendSMS } from '../config/twilio';
import { sendPushNotification, sendMulticastPushNotification } from '../config/firebase';
import { AppError } from '../middleware/errorHandler';
import logger from '../utils/logger';
import redis from '../config/redis';

export class VisitorService {
  // Create visitor pass
  static async createVisitorPass(
    userId: number,
    data: {
      visitorName: string;
      visitorPhone: string;
      vehicleNumber?: string;
      validityHours: number;
      purpose?: string;
      isRecurring?: boolean;
      recurringDays?: number[];
    }
  ): Promise<VisitorPass> {
    try {
      // Generate unique OTP
      const otp = generateOTP(6);
      const formattedPhone = formatPhoneNumber(data.visitorPhone);
      
      // Calculate validity period
      const validFrom = new Date();
      const validUntil = moment().add(data.validityHours, 'hours').toDate();
      
      // Create visitor pass
      const visitorPass = await VisitorPass.create({
        userId,
        visitorName: data.visitorName,
        visitorPhone: formattedPhone,
        vehicleNumber: data.vehicleNumber,
        otp,
        status: VisitorPassStatus.PENDING,
        validFrom,
        validUntil,
        purpose: data.purpose,
        isRecurring: data.isRecurring || false,
        recurringDays: data.recurringDays
      });
      
      // Get user details
      const user = await User.findByPk(userId, {
        include: [
          { model: Society, as: 'society' },
          { model: Flat, as: 'flat' }
        ]
      });
      
      // Send OTP to visitor via SMS
      const message = `Your OTP for visiting ${user?.name} at ${user?.society?.name} is ${otp}. Valid for ${data.validityHours} hours.`;
      await sendSMS(formattedPhone, message);
      
      // Cache visitor pass for quick lookup
      const redisKey = `visitor_otp:${otp}`;
      const redisValue = JSON.stringify({
        passId: visitorPass.id,
        userId,
        visitorName: data.visitorName
      });
      const expirySeconds = data.validityHours * 3600;
      
      await redis.set(redisKey, redisValue);
      await redis.expire(redisKey, expirySeconds);
      
      logger.info(`Visitor pass created: ${visitorPass.id}`);
      return visitorPass;
    } catch (error) {
      logger.error('Error creating visitor pass:', error);
      throw error;
    }
  }

  // Verify visitor OTP (by guard)
  static async verifyVisitorOTP(
    otp: string,
    guardId: number
  ): Promise<{
    visitorPass: VisitorPass;
    resident: User;
  }> {
    try {
      // Check cache first
      const cached = await redis.get(`visitor_otp:${otp}`);
      let visitorPass: VisitorPass | null = null;
      
      if (cached) {
        const data = JSON.parse(cached);
        visitorPass = await VisitorPass.findByPk(data.passId);
      } else {
        // Fallback to database
        visitorPass = await VisitorPass.findOne({
          where: {
            otp,
            status: VisitorPassStatus.PENDING
          }
        });
      }
      
      if (!visitorPass) {
        throw new AppError('Invalid OTP', 400);
      }
      
      // Check validity
      if (!isWithinValidity(visitorPass.validFrom, visitorPass.validUntil)) {
        await visitorPass.update({ status: VisitorPassStatus.EXPIRED });
        throw new AppError('Visitor pass has expired', 400);
      }
      
      // Get resident details
      const resident = await User.findByPk(visitorPass.userId, {
        include: [
          { model: Society, as: 'society' },
          { model: User, as: 'flat' }
        ]
      });
      
      if (!resident) {
        throw new AppError('Resident not found', 404);
      }
      
      // Mark as approved and record entry
      await visitorPass.update({
        status: VisitorPassStatus.APPROVED,
        entryTime: new Date(),
        guardIdEntry: guardId
      });
      
      // Send notification to resident
      if (resident.fcmToken) {
        await sendPushNotification(
          resident.fcmToken,
          'Visitor Arrived',
          `${visitorPass.visitorName} has arrived at the gate`,
          {
            type: 'visitor_arrival',
            passId: visitorPass.id.toString()
          }
        );
      }
      
      // Clear cache
      await redis.del(`visitor_otp:${otp}`);
      
      return { visitorPass, resident };
    } catch (error) {
      logger.error('Error verifying visitor OTP:', error);
      throw error;
    }
  }

  // Update visitor entry/exit
  static async updateVisitorEntry(
    passId: number,
    guardId: number,
    action: 'entry' | 'exit',
    photo?: string,
    notes?: string
  ): Promise<VisitorPass> {
    try {
      const visitorPass = await VisitorPass.findByPk(passId);
      
      if (!visitorPass) {
        throw new AppError('Visitor pass not found', 404);
      }
      
      const updateData: any = {};
      
      if (action === 'entry') {
        if (visitorPass.entryTime) {
          throw new AppError('Entry already recorded', 400);
        }
        updateData.entryTime = new Date();
        updateData.guardIdEntry = guardId;
        updateData.status = VisitorPassStatus.USED;
        if (photo) updateData.entryPhoto = photo;
      } else {
        if (!visitorPass.entryTime) {
          throw new AppError('No entry recorded', 400);
        }
        if (visitorPass.exitTime) {
          throw new AppError('Exit already recorded', 400);
        }
        updateData.exitTime = new Date();
        updateData.guardIdExit = guardId;
      }
      
      if (notes) updateData.notes = notes;
      
      await visitorPass.update(updateData);
      
      // Send notification to resident
      const resident = await User.findByPk(visitorPass.userId);
      if (resident?.fcmToken) {
        await sendPushNotification(
          resident.fcmToken,
          action === 'entry' ? 'Visitor Entry' : 'Visitor Exit',
          `${visitorPass.visitorName} has ${action === 'entry' ? 'entered' : 'left'} the premises`,
          {
            type: `visitor_${action}`,
            passId: visitorPass.id.toString()
          }
        );
      }
      
      return visitorPass;
    } catch (error) {
      logger.error('Error updating visitor entry:', error);
      throw error;
    }
  }

  // Get visitor passes for resident
  static async getVisitorPasses(
    userId: number,
    filters: {
      status?: VisitorPassStatus;
      fromDate?: Date;
      toDate?: Date;
      page?: number;
      limit?: number;
    }
  ): Promise<{
    passes: VisitorPass[];
    total: number;
  }> {
    try {
      const where: any = { userId };
      
      if (filters.status) {
        where.status = filters.status;
      }
      
      if (filters.fromDate || filters.toDate) {
        where.createdAt = {};
        if (filters.fromDate) where.createdAt[Op.gte] = filters.fromDate;
        if (filters.toDate) where.createdAt[Op.lte] = filters.toDate;
      }
      
      const page = filters.page || 1;
      const limit = filters.limit || 20;
      const offset = (page - 1) * limit;
      
      const { rows: passes, count: total } = await VisitorPass.findAndCountAll({
        where,
        include: [
          { model: User, as: 'entryGuard', attributes: ['id', 'name'] },
          { model: User, as: 'exitGuard', attributes: ['id', 'name'] }
        ],
        order: [['createdAt', 'DESC']],
        limit,
        offset
      });
      
      return { passes, total };
    } catch (error) {
      logger.error('Error getting visitor passes:', error);
      throw error;
    }
  }

  // Get expected visitors for guard
  static async getExpectedVisitors(
    societyId: number,
    date?: Date
  ): Promise<VisitorPass[]> {
    try {
      const targetDate = date || new Date();
      const startOfDay = moment(targetDate).startOf('day').toDate();
      const endOfDay = moment(targetDate).endOf('day').toDate();
      
      const visitors = await VisitorPass.findAll({
        where: {
          validFrom: { [Op.lte]: endOfDay },
          validUntil: { [Op.gte]: startOfDay },
          status: {
            [Op.in]: [VisitorPassStatus.PENDING, VisitorPassStatus.APPROVED]
          }
        },
        include: [
          {
            model: User,
            as: 'user',
            where: { societyId },
            attributes: ['id', 'name', 'phoneNumber', 'flatId'],
            include: [
              { model: User, as: 'flat', attributes: ['flatNumber'] }
            ]
          }
        ],
        order: [['validFrom', 'ASC']]
      });
      
      // Filter recurring visitors
      const dayOfWeek = moment(targetDate).day();
      return visitors.filter(visitor => {
        if (!visitor.isRecurring) return true;
        return visitor.recurringDays?.includes(dayOfWeek);
      });
    } catch (error) {
      logger.error('Error getting expected visitors:', error);
      throw error;
    }
  }

  // Request visitor approval (when guard adds new visitor without OTP)
  static async requestVisitorApproval(
    guardId: number,
    residentId: number,
    visitorData: {
      visitorName: string;
      visitorPhone: string;
      vehicleNumber?: string;
      purpose?: string;
      photo?: string;
    }
  ): Promise<VisitorPass> {
    try {
      // Create pending visitor pass
      const visitorPass = await VisitorPass.create({
        userId: residentId,
        visitorName: visitorData.visitorName,
        visitorPhone: formatPhoneNumber(visitorData.visitorPhone),
        vehicleNumber: visitorData.vehicleNumber,
        otp: generateOTP(6), // Generate but don't send
        status: VisitorPassStatus.PENDING,
        validFrom: new Date(),
        validUntil: moment().add(5, 'minutes').toDate(), // 5 min approval window
        purpose: visitorData.purpose,
        entryPhoto: visitorData.photo,
        guardIdEntry: guardId,
        notes: 'Awaiting resident approval'
      });
      
      // Send push notification to resident
      const resident = await User.findByPk(residentId);
      if (resident?.fcmToken) {
        await sendPushNotification(
          resident.fcmToken,
          'Visitor Approval Required',
          `${visitorData.visitorName} is at the gate. Approve entry?`,
          {
            type: 'visitor_approval_request',
            passId: visitorPass.id.toString(),
            requiresAction: 'true'
          }
        );
      }
      
      // Auto-reject after 5 minutes
      setTimeout(async () => {
        const pass = await VisitorPass.findByPk(visitorPass.id);
        if (pass && pass.status === VisitorPassStatus.PENDING) {
          await pass.update({
            status: VisitorPassStatus.REJECTED,
            rejectionReason: 'Auto-rejected: No response from resident'
          });
        }
      }, 5 * 60 * 1000);
      
      return visitorPass;
    } catch (error) {
      logger.error('Error requesting visitor approval:', error);
      throw error;
    }
  }

  // Approve/reject visitor
  static async handleVisitorApproval(
    passId: number,
    userId: number,
    approved: boolean,
    reason?: string
  ): Promise<VisitorPass> {
    try {
      const visitorPass = await VisitorPass.findOne({
        where: { id: passId, userId }
      });
      
      if (!visitorPass) {
        throw new AppError('Visitor pass not found', 404);
      }
      
      if (visitorPass.status !== VisitorPassStatus.PENDING) {
        throw new AppError('Visitor pass already processed', 400);
      }
      
      if (approved) {
        // Extend validity for 24 hours
        await visitorPass.update({
          status: VisitorPassStatus.APPROVED,
          validUntil: moment().add(24, 'hours').toDate(),
          entryTime: new Date()
        });
        
        // Notify guard
        const guard = await User.findByPk(visitorPass.guardIdEntry!);
        if (guard?.fcmToken) {
          await sendPushNotification(
            guard.fcmToken,
            'Visitor Approved',
            `Entry approved for ${visitorPass.visitorName}`,
            {
              type: 'visitor_approved',
              passId: visitorPass.id.toString()
            }
          );
        }
      } else {
        await visitorPass.update({
          status: VisitorPassStatus.REJECTED,
          rejectionReason: reason || 'Rejected by resident'
        });
        
        // Notify guard
        const guard = await User.findByPk(visitorPass.guardIdEntry!);
        if (guard?.fcmToken) {
          await sendPushNotification(
            guard.fcmToken,
            'Visitor Rejected',
            `Entry denied for ${visitorPass.visitorName}`,
            {
              type: 'visitor_rejected',
              passId: visitorPass.id.toString()
            }
          );
        }
      }
      
      return visitorPass;
    } catch (error) {
      logger.error('Error handling visitor approval:', error);
      throw error;
    }
  }

  // Get visitor pass by ID
  static async getVisitorPassById(
    passId: number,
    requestingUserId: number,
    requestingUserRole: UserRole,
    requestingUserSocietyId?: number
  ): Promise<VisitorPass> {
    try {
      const visitorPass = await VisitorPass.findByPk(passId, {
        include: [
          {
            model: User,
            as: 'user', // Resident
            attributes: ['id', 'name', 'phoneNumber', 'societyId', 'flatId'],
            include: [
              { model: Society, as: 'society', attributes: ['id', 'name'] },
              { model: Flat, as: 'flat', attributes: ['id', 'flatNumber', 'block'] },
            ],
          },
          { model: User, as: 'entryGuard', attributes: ['id', 'name'] },
          { model: User, as: 'exitGuard', attributes: ['id', 'name'] },
        ],
      });

      if (!visitorPass) {
        throw new AppError('Visitor pass not found', 404);
      }

      // Authorization check
      if (requestingUserRole === UserRole.RESIDENT) {
        if (visitorPass.userId !== requestingUserId) {
          throw new AppError('Forbidden: You can only view your own visitor passes', 403);
        }
      } else if (requestingUserRole === UserRole.GUARD) {
        // Ensure the pass belongs to a resident in the guard's society
        if (!visitorPass.user || visitorPass.user.societyId !== requestingUserSocietyId) {
          throw new AppError('Forbidden: You can only view passes for your society', 403);
        }
      } else if (requestingUserRole !== UserRole.ADMIN) {
        // If not resident, guard, or admin, deny access (should not happen if routes are set up correctly)
        throw new AppError('Forbidden', 403);
      }
      // Admins have access by default if they reach this point

      return visitorPass;
    } catch (error) {
      logger.error(`Error getting visitor pass by ID ${passId}:`, error);
      throw error;
    }
  }
} 