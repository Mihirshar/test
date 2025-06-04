import { Op } from 'sequelize';
import moment from 'moment';
import MaintenanceBill from '../models/MaintenanceBill';
import Payment from '../models/Payment';
import Flat from '../models/Flat';
import User from '../models/User';
import Society from '../models/Society';
import { PaymentStatus, UserRole, BillCreateData, BillUpdateData } from '../types';
import { generateBillNumber, generateTransactionId, generatePaymentQRData, calculateLateFee } from '../utils/helpers';
import { sendNotification, sendMulticastNotification } from '../config/firebase';
import { AppError } from '../middleware/errorHandler';
import logger from '../utils/logger';
import redis from '../config/redis';
import { NotFoundError } from '../utils/errors';

export class BillingService {
  // Create maintenance bill
  static async createMaintenanceBill(
    flatId: number,
    societyId: number,
    data: {
      amount: number;
      billDate: Date;
      dueDate: Date;
      billPeriod: string;
      breakdown: {
        maintenance: number;
        water: number;
        electricity?: number;
        others?: Record<string, number>;
      };
      notes?: string;
    }
  ): Promise<MaintenanceBill> {
    try {
      // Get flat details
      const flat = await Flat.findByPk(flatId);
      if (!flat || flat.societyId !== societyId) {
        throw new AppError('Flat not found', 404);
      }
      
      // Check for duplicate bill
      const existingBill = await MaintenanceBill.findOne({
        where: {
          flatId,
          billPeriod: data.billPeriod
        }
      });
      
      if (existingBill) {
        throw new AppError('Bill already exists for this period', 400);
      }
      
      // Generate bill number
      const billNumber = generateBillNumber(flat.flatNumber, data.billDate);
      
      // Generate QR code data
      const society = await Society.findByPk(societyId);
      const qrCode = generatePaymentQRData(
        billNumber,
        data.amount,
        'safehood@upi' // Default UPI ID - can be made configurable
      );
      
      // Create bill
      const bill = await MaintenanceBill.create({
        flatId,
        societyId,
        billNumber,
        amount: data.amount,
        billDate: data.billDate,
        dueDate: data.dueDate,
        billPeriod: data.billPeriod,
        status: PaymentStatus.PENDING,
        paidAmount: 0,
        breakdown: data.breakdown,
        notes: data.notes,
        qrCode,
        reminderCount: 0
      });
      
      // Send notification to residents
      await this.sendBillNotification(bill, flat, 'new');
      
      logger.info(`Maintenance bill created: ${bill.id}`);
      return bill;
    } catch (error) {
      logger.error('Error creating maintenance bill:', error);
      throw error;
    }
  }

  // Get bills for resident
  static async getBillsForResident(
    userId: number,
    filters: {
      status?: PaymentStatus;
      year?: number;
      month?: number;
      page?: number;
      limit?: number;
    }
  ): Promise<{
    bills: MaintenanceBill[];
    total: number;
    totalDue: number;
  }> {
    try {
      // Get user's flat
      const user = await User.findByPk(userId);
      if (!user || !user.flatId) {
        throw new AppError('User not associated with any flat', 400);
      }
      
      const where: any = { flatId: user.flatId };
      
      if (filters.status) {
        where.status = filters.status;
      }
      
      if (filters.year || filters.month) {
        const startDate = moment()
          .year(filters.year || moment().year())
          .month(filters.month ? filters.month - 1 : 0)
          .startOf(filters.month ? 'month' : 'year')
          .toDate();
        
        const endDate = moment()
          .year(filters.year || moment().year())
          .month(filters.month ? filters.month - 1 : 11)
          .endOf(filters.month ? 'month' : 'year')
          .toDate();
        
        where.billDate = {
          [Op.between]: [startDate, endDate]
        };
      }
      
      const page = filters.page || 1;
      const limit = filters.limit || 20;
      const offset = (page - 1) * limit;
      
      const { rows: bills, count: total } = await MaintenanceBill.findAndCountAll({
        where,
        include: [
          {
            model: Payment,
            as: 'payments',
            required: false
          }
        ],
        order: [['billDate', 'DESC']],
        limit,
        offset
      });
      
      // Calculate total due with late fees
      const totalDue = bills
        .filter(bill => bill.status !== PaymentStatus.PAID)
        .reduce((sum, bill) => {
          const lateFee = calculateLateFee(bill.amount, bill.dueDate);
          return sum + bill.amount - bill.paidAmount + lateFee;
        }, 0);
      
      return { bills, total, totalDue };
    } catch (error) {
      logger.error('Error getting bills for resident:', error);
      throw error;
    }
  }

  // Get bill by ID
  static async getBillById(
    billId: number,
    userId: number
  ): Promise<MaintenanceBill> {
    try {
      const bill = await MaintenanceBill.findByPk(billId, {
        include: [
          {
            model: Flat,
            as: 'flat',
            attributes: ['id', 'flatNumber', 'block']
          },
          {
            model: Payment,
            as: 'payments',
            include: [
              {
                model: User,
                as: 'user',
                attributes: ['id', 'name']
              }
            ]
          }
        ]
      });
      
      if (!bill) {
        throw new AppError('Bill not found', 404);
      }
      
      // Check access permission
      const user = await User.findByPk(userId);
      if (user?.role === UserRole.RESIDENT && user.flatId !== bill.flatId) {
        throw new AppError('Unauthorized to view this bill', 403);
      }
      
      // Calculate and update late fee if needed
      if (bill.status !== PaymentStatus.PAID) {
        const lateFee = calculateLateFee(bill.amount, bill.dueDate);
        if (lateFee !== bill.lateFee) {
          await bill.update({ lateFee });
        }
      }
      
      return bill;
    } catch (error) {
      logger.error('Error getting bill by ID:', error);
      throw error;
    }
  }

  // Record payment
  static async recordPayment(
    billId: number,
    userId: number,
    data: {
      amount: number;
      paymentMethod: string;
      referenceNumber?: string;
      metadata?: any;
      notes?: string;
    }
  ): Promise<Payment> {
    try {
      const bill = await MaintenanceBill.findByPk(billId);
      if (!bill) {
        throw new AppError('Bill not found', 404);
      }
      
      if (bill.status === PaymentStatus.PAID) {
        throw new AppError('Bill already paid', 400);
      }
      
      // Create payment record
      const payment = await Payment.create({
        billId,
        userId,
        transactionId: generateTransactionId(),
        amount: data.amount,
        paymentMethod: data.paymentMethod,
        paymentDate: new Date(),
        referenceNumber: data.referenceNumber,
        metadata: data.metadata,
        notes: data.notes
      });
      
      // Update bill
      const newPaidAmount = Number(bill.paidAmount) + data.amount;
      const billTotal = Number(bill.amount) + Number(bill.lateFee || 0);
      
      await bill.update({
        paidAmount: newPaidAmount,
        status: newPaidAmount >= billTotal ? PaymentStatus.PAID : PaymentStatus.PARTIAL,
        paidDate: newPaidAmount >= billTotal ? new Date() : null
      });
      
      // Send confirmation
      const user = await User.findByPk(userId);
      if (user?.fcmToken) {
        await sendNotification(
          user.fcmToken,
          'Payment Received',
          `Payment of ₹${data.amount} received for bill ${bill.billNumber}`,
          {
            type: 'payment_confirmation',
            billId: bill.id.toString(),
            paymentId: payment.id.toString()
          }
        );
      }
      
      logger.info(`Payment recorded: ${payment.id} for bill ${billId}`);
      return payment;
    } catch (error) {
      logger.error('Error recording payment:', error);
      throw error;
    }
  }

  // Send bill reminders
  static async sendBillReminders(): Promise<void> {
    try {
      const overdueBills = await MaintenanceBill.findAll({
        where: {
          status: {
            [Op.in]: [PaymentStatus.PENDING, PaymentStatus.PARTIAL]
          },
          dueDate: {
            [Op.lt]: new Date()
          },
          lastReminderAt: {
            [Op.or]: [
              null,
              { [Op.lt]: moment().subtract(3, 'days').toDate() }
            ]
          }
        },
        include: [
          {
            model: Flat,
            as: 'flat',
            include: [
              {
                model: User,
                as: 'residents',
                where: {
                  role: UserRole.RESIDENT,
                  fcmToken: { [Op.ne]: null }
                },
                required: false
              }
            ]
          }
        ]
      });
      
      for (const bill of overdueBills) {
        const daysOverdue = moment().diff(moment(bill.dueDate), 'days');
        const lateFee = calculateLateFee(bill.amount, bill.dueDate);
        const totalDue = Number(bill.amount) + lateFee - Number(bill.paidAmount);
        
        // Update late fee
        if (lateFee !== bill.lateFee) {
          await bill.update({ lateFee });
        }
        
        // Send reminders
        const tokens = bill.flat?.residents
          ?.map(r => r.fcmToken)
          .filter(Boolean) as string[] || [];
        
        if (tokens.length > 0) {
          await sendMulticastNotification(
            tokens,
            'Payment Reminder',
            `Your maintenance bill is overdue by ${daysOverdue} days. Total due: ₹${totalDue}`,
            {
              type: 'bill_reminder',
              billId: bill.id.toString(),
              daysOverdue: daysOverdue.toString()
            }
          );
          
          await bill.update({
            reminderCount: bill.reminderCount + 1,
            lastReminderAt: new Date()
          });
        }
      }
      
      logger.info(`Sent reminders for ${overdueBills.length} overdue bills`);
    } catch (error) {
      logger.error('Error sending bill reminders:', error);
    }
  }

  // Get payment history
  static async getPaymentHistory(
    filters: {
      userId?: number;
      flatId?: number;
      fromDate?: Date;
      toDate?: Date;
      page?: number;
      limit?: number;
    }
  ): Promise<{
    payments: Payment[];
    total: number;
    totalAmount: number;
  }> {
    try {
      const where: any = {};
      const billWhere: any = {};
      
      if (filters.userId) where.userId = filters.userId;
      if (filters.flatId) billWhere.flatId = filters.flatId;
      
      if (filters.fromDate || filters.toDate) {
        where.paymentDate = {};
        if (filters.fromDate) where.paymentDate[Op.gte] = filters.fromDate;
        if (filters.toDate) where.paymentDate[Op.lte] = filters.toDate;
      }
      
      const page = filters.page || 1;
      const limit = filters.limit || 20;
      const offset = (page - 1) * limit;
      
      const { rows: payments, count: total } = await Payment.findAndCountAll({
        where,
        include: [
          {
            model: MaintenanceBill,
            as: 'bill',
            where: billWhere,
            required: true,
            include: [
              {
                model: Flat,
                as: 'flat',
                attributes: ['flatNumber', 'block']
              }
            ]
          },
          {
            model: User,
            as: 'user',
            attributes: ['id', 'name']
          }
        ],
        order: [['paymentDate', 'DESC']],
        limit,
        offset
      });
      
      const totalAmount = payments.reduce((sum, payment) => sum + Number(payment.amount), 0);
      
      return { payments, total, totalAmount };
    } catch (error) {
      logger.error('Error getting payment history:', error);
      throw error;
    }
  }

  // Send bill notification
  private static async sendBillNotification(
    bill: MaintenanceBill,
    flat: Flat,
    type: 'new' | 'reminder'
  ): Promise<void> {
    try {
      const residents = await User.findAll({
        where: {
          flatId: flat.id,
          role: UserRole.RESIDENT,
          fcmToken: { [Op.ne]: null }
        }
      });
      
      const tokens = residents.map(r => r.fcmToken).filter(Boolean) as string[];
      
      if (tokens.length > 0) {
        const title = type === 'new' ? 'New Maintenance Bill' : 'Bill Reminder';
        const body = type === 'new'
          ? `New bill of ₹${bill.amount} for ${bill.billPeriod}. Due date: ${moment(bill.dueDate).format('DD MMM YYYY')}`
          : `Your bill for ${bill.billPeriod} is pending. Please pay by ${moment(bill.dueDate).format('DD MMM YYYY')}`;
        
        await sendMulticastNotification(
          tokens,
          title,
          body,
          {
            type: type === 'new' ? 'new_bill' : 'bill_reminder',
            billId: bill.id.toString()
          }
        );
      }
    } catch (error) {
      logger.error('Error sending bill notification:', error);
    }
  }
} 