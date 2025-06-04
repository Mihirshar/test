import { Op } from 'sequelize';
import Emergency from '../models/Emergency';
import User from '../models/User';
import Society from '../models/Society';
import { EmergencyStatus, UserRole } from '../types';
import { sendNotification, sendMulticastNotification, sendTopicNotification } from '../config/firebase';
import { makeCall, sendSMS } from '../config/twilio';
import { AppError } from '../middleware/errorHandler';
import config from '../config/env';
import logger from '../utils/logger';
import redis from '../config/redis';

export class EmergencyService {
  // Create emergency alert
  static async createEmergency(
    userId: number,
    data: {
      description?: string;
      location?: {
        lat?: number;
        lng?: number;
        address?: string;
      };
    }
  ): Promise<Emergency> {
    try {
      // Get user details
      const user = await User.findByPk(userId, {
        include: [
          { model: Society, as: 'society' },
          { model: User, as: 'flat' }
        ]
      });
      
      if (!user || !user.societyId) {
        throw new AppError('User not found or not associated with society', 404);
      }
      
      // Check for recent emergencies (prevent spam)
      const recentEmergency = await Emergency.findOne({
        where: {
          userId,
          status: EmergencyStatus.ACTIVE,
          createdAt: { [Op.gte]: new Date(Date.now() - 5 * 60 * 1000) } // 5 minutes
        }
      });
      
      if (recentEmergency) {
        throw new AppError('An emergency alert is already active', 400);
      }
      
      // Create emergency
      const emergency = await Emergency.create({
        userId,
        societyId: user.societyId,
        status: EmergencyStatus.ACTIVE,
        description: data.description,
        location: data.location,
        notifiedUsers: []
      });
      
      // Send notifications
      await this.sendEmergencyNotifications(emergency, user);
      
      // Initiate emergency call if configured
      if (config.emergency.contactNumber) {
        await this.initiateEmergencyCall(emergency, user);
      }
      
      // Cache active emergency
      await redis.set(
        `emergency:${emergency.id}:status`,
        'active',
        'EX',
        config.EMERGENCY_EXPIRY_SECONDS
      );
      
      logger.info(`Emergency created: ${emergency.id} by user ${userId}`);
      return emergency;
    } catch (error) {
      logger.error('Error creating emergency:', error);
      throw error;
    }
  }

  // Resolve emergency
  static async resolveEmergency(
    emergencyId: number,
    resolvedBy: number,
    status: 'resolved' | 'false_alarm',
    notes?: string
  ): Promise<Emergency> {
    try {
      const emergency = await Emergency.findByPk(emergencyId);
      
      if (!emergency) {
        throw new AppError('Emergency not found', 404);
      }
      
      if (emergency.status !== EmergencyStatus.ACTIVE) {
        throw new AppError('Emergency already resolved', 400);
      }
      
      // Update emergency
      await emergency.update({
        status: status === 'resolved' ? EmergencyStatus.RESOLVED : EmergencyStatus.FALSE_ALARM,
        resolvedAt: new Date(),
        resolvedBy,
        resolutionNotes: notes
      });
      
      // Send resolution notification
      await this.sendResolutionNotification(emergency);
      
      // Clear cache
      await redis.del(`emergency:active:${emergency.userId}`);
      
      logger.info(`Emergency ${emergencyId} resolved by ${resolvedBy}`);
      return emergency;
    } catch (error) {
      logger.error('Error resolving emergency:', error);
      throw error;
    }
  }

  // Get active emergencies for society
  static async getActiveEmergencies(societyId: number): Promise<Emergency[]> {
    try {
      const emergencies = await Emergency.findAll({
        where: {
          societyId,
          status: EmergencyStatus.ACTIVE
        },
        include: [
          {
            model: User,
            as: 'user',
            attributes: ['id', 'name', 'phoneNumber', 'flatId'],
            include: [
              { model: User, as: 'flat', attributes: ['flatNumber'] }
            ]
          }
        ],
        order: [['createdAt', 'DESC']]
      });
      
      return emergencies;
    } catch (error) {
      logger.error('Error getting active emergencies:', error);
      throw error;
    }
  }

  // Get emergency history
  static async getEmergencyHistory(
    filters: {
      societyId?: number;
      userId?: number;
      status?: EmergencyStatus;
      fromDate?: Date;
      toDate?: Date;
      page?: number;
      limit?: number;
    }
  ): Promise<{
    emergencies: Emergency[];
    total: number;
  }> {
    try {
      const where: any = {};
      
      if (filters.societyId) where.societyId = filters.societyId;
      if (filters.userId) where.userId = filters.userId;
      if (filters.status) where.status = filters.status;
      
      if (filters.fromDate || filters.toDate) {
        where.createdAt = {};
        if (filters.fromDate) where.createdAt[Op.gte] = filters.fromDate;
        if (filters.toDate) where.createdAt[Op.lte] = filters.toDate;
      }
      
      const page = filters.page || 1;
      const limit = filters.limit || 20;
      const offset = (page - 1) * limit;
      
      const { rows: emergencies, count: total } = await Emergency.findAndCountAll({
        where,
        include: [
          {
            model: User,
            as: 'user',
            attributes: ['id', 'name', 'phoneNumber']
          },
          {
            model: User,
            as: 'resolver',
            attributes: ['id', 'name']
          }
        ],
        order: [['createdAt', 'DESC']],
        limit,
        offset
      });
      
      return { emergencies, total };
    } catch (error) {
      logger.error('Error getting emergency history:', error);
      throw error;
    }
  }

  // Send emergency notifications
  private static async sendEmergencyNotifications(
    emergency: Emergency,
    user: User
  ): Promise<void> {
    try {
      const notificationData = {
        type: 'emergency_alert',
        emergencyId: emergency.id.toString(),
        userId: user.id.toString(),
        userName: user.name,
        flatNumber: user.flat?.flatNumber || 'Unknown',
        timestamp: emergency.createdAt.toISOString()
      };
      
      // Notify all guards in the society
      const guards = await User.findAll({
        where: {
          societyId: emergency.societyId,
          role: UserRole.GUARD,
          fcmToken: { [Op.ne]: null },
          isActive: true
        },
        attributes: ['id', 'fcmToken']
      });
      
      const guardTokens = guards.map(g => g.fcmToken).filter(Boolean) as string[];
      const notifiedUserIds = guards.map(g => g.id);
      
      if (guardTokens.length > 0) {
        await sendMulticastNotification(
          guardTokens,
          '🚨 EMERGENCY ALERT',
          `Emergency reported by ${user.name} from Flat ${user.flat?.flatNumber || 'Unknown'}`,
          notificationData
        );
      }
      
      // Notify admin
      await sendTopicNotification(
        `society_${emergency.societyId}_admin`,
        '🚨 EMERGENCY ALERT',
        `Emergency reported by ${user.name}`,
        notificationData
      );
      
      // Update notified users
      await emergency.update({ notifiedUsers: notifiedUserIds });
      
    } catch (error) {
      logger.error('Error sending emergency notifications:', error);
      // Don't throw - notification failure shouldn't fail emergency creation
    }
  }

  // Initiate emergency call
  private static async initiateEmergencyCall(
    emergency: Emergency,
    user: User
  ): Promise<void> {
    try {
      const message = `This is an automated emergency call from Safehood. ${user.name} from ${user.society?.name} has triggered an emergency alert. Please check the app for details.`;
      
      const callSid = await makeCall(config.emergency.contactNumber, message);
      
      await emergency.update({
        callInitiated: true,
        callSid
      });
      
      logger.info(`Emergency call initiated for emergency ${emergency.id}`);
    } catch (error) {
      logger.error('Error initiating emergency call:', error);
      // Don't throw - call failure shouldn't fail emergency creation
    }
  }

  // Send resolution notification
  private static async sendResolutionNotification(emergency: Emergency): Promise<void> {
    try {
      const user = await User.findByPk(emergency.userId);
      const resolver = await User.findByPk(emergency.resolvedBy!);
      
      const message = emergency.status === EmergencyStatus.RESOLVED
        ? `Emergency has been resolved by ${resolver?.name}`
        : `Emergency marked as false alarm by ${resolver?.name}`;
      
      const notificationData = {
        type: 'emergency_resolved',
        emergencyId: emergency.id.toString(),
        status: emergency.status
      };
      
      // Notify the user who created the emergency
      if (user?.fcmToken) {
        await sendNotification(
          user.fcmToken,
          'Emergency Status Update',
          message,
          notificationData
        );
      }
      
      // Notify previously notified users
      if (emergency.notifiedUsers && emergency.notifiedUsers.length > 0) {
        const notifiedUsers = await User.findAll({
          where: {
            id: { [Op.in]: emergency.notifiedUsers },
            fcmToken: { [Op.ne]: null }
          },
          attributes: ['fcmToken']
        });
        
        const tokens = notifiedUsers.map(u => u.fcmToken).filter(Boolean) as string[];
        
        if (tokens.length > 0) {
          await sendMulticastNotification(
            tokens,
            'Emergency Resolved',
            message,
            notificationData
          );
        }
      }
    } catch (error) {
      logger.error('Error sending resolution notification:', error);
    }
  }

  // Check for stale emergencies (auto-resolve after 1 hour)
  static async checkStaleEmergencies(): Promise<void> {
    try {
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
      
      const staleEmergencies = await Emergency.findAll({
        where: {
          status: EmergencyStatus.ACTIVE,
          createdAt: { [Op.lt]: oneHourAgo }
        }
      });
      
      for (const emergency of staleEmergencies) {
        await emergency.update({
          status: EmergencyStatus.RESOLVED,
          resolvedAt: new Date(),
          resolutionNotes: 'Auto-resolved after 1 hour'
        });
        
        logger.info(`Auto-resolved stale emergency: ${emergency.id}`);
      }
    } catch (error) {
      logger.error('Error checking stale emergencies:', error);
    }
  }
} 