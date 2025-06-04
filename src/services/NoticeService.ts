import { Op } from 'sequelize';
import Notice from '../models/Notice';
import NoticeReadStatus from '../models/NoticeReadStatus';
import User from '../models/User';
import Society from '../models/Society';
import { NoticeType, NoticePriority, UserRole } from '../types';
import { sendMulticastPushNotification, messaging as firebaseMessaging } from '../config/firebase';
import { AppError } from '../middleware/errorHandler';
import logger from '../utils/logger';
import redis from '../config/redis';

export class NoticeService {
  // Create notice
  static async createNotice(
    createdBy: number,
    societyId: number,
    data: {
      title: string;
      content: string;
      type: NoticeType;
      priority: NoticePriority;
      expiryDate?: Date;
      targetFlats?: number[];
      attachments?: Array<{
        url: string;
        type: string;
        name: string;
      }>;
    }
  ): Promise<Notice> {
    try {
      // Check if user has permission (admin or society manager)
      const user = await User.findByPk(createdBy);
      if (!user || (user.role !== UserRole.ADMIN && user.societyId !== societyId)) {
        throw new AppError('Unauthorized to create notices', 403);
      }
      
      // Create notice
      const notice = await Notice.create({
        societyId,
        createdBy,
        title: data.title,
        content: data.content,
        type: data.type,
        priority: data.priority,
        expiryDate: data.expiryDate,
        targetFlats: data.targetFlats,
        attachments: data.attachments,
        isCritical: data.priority === NoticePriority.CRITICAL,
        isActive: true
      });
      
      // Send push notifications
      await this.sendNoticeNotifications(notice, societyId);
      
      // Cache recent notices
      await this.cacheRecentNotices(societyId);
      
      logger.info(`Notice created: ${notice.id}`);
      return notice;
    } catch (error) {
      logger.error('Error creating notice:', error);
      throw error;
    }
  }

  // Get notices for user
  static async getNotices(
    userId: number,
    filters: {
      type?: NoticeType;
      unreadOnly?: boolean;
      page?: number;
      limit?: number;
    }
  ): Promise<{
    notices: any[];
    total: number;
  }> {
    try {
      const user = await User.findByPk(userId);
      if (!user || !user.societyId) {
        throw new AppError('User not found or not associated with society', 404);
      }
      
      // Build query
      const where: any = {
        societyId: user.societyId,
        isActive: true,
        [Op.or]: [
          { expiryDate: null },
          { expiryDate: { [Op.gt]: new Date() } }
        ]
      };
      
      if (filters.type) {
        where.type = filters.type;
      }
      
      // Check if notice is targeted to user's flat
      if (user.flatId) {
        where[Op.or].push(
          { targetFlats: null },
          { targetFlats: { [Op.contains]: [user.flatId] } }
        );
      }
      
      const page = filters.page || 1;
      const limit = filters.limit || 20;
      const offset = (page - 1) * limit;
      
      // Get notices with read status
      const { rows: notices, count: total } = await Notice.findAndCountAll({
        where,
        include: [
          {
            model: NoticeReadStatus,
            as: 'readStatuses',
            where: { userId },
            required: false
          },
          {
            model: User,
            as: 'creator',
            attributes: ['id', 'name']
          }
        ],
        order: [
          ['isCritical', 'DESC'],
          ['priority', 'DESC'],
          ['createdAt', 'DESC']
        ],
        limit,
        offset
      });
      
      // Transform data
      const transformedNotices = notices.map(notice => {
        const readStatus = notice.readStatuses?.[0];
        return {
          ...notice.toJSON(),
          isRead: !!readStatus,
          readAt: readStatus?.readAt,
          isMuted: readStatus?.isMuted || false,
          readStatuses: undefined // Remove from response
        };
      });
      
      // Filter unread if requested
      let filteredNotices = transformedNotices;
      if (filters.unreadOnly) {
        filteredNotices = transformedNotices.filter(n => !n.isRead);
      }
      
      return {
        notices: filteredNotices,
        total: filters.unreadOnly ? filteredNotices.length : total
      };
    } catch (error) {
      logger.error('Error getting notices:', error);
      throw error;
    }
  }

  // Mark notice as read
  static async markNoticeAsRead(
    noticeId: number,
    userId: number
  ): Promise<NoticeReadStatus> {
    try {
      // Check if notice exists
      const notice = await Notice.findByPk(noticeId);
      if (!notice) {
        throw new AppError('Notice not found', 404);
      }
      
      // Find or create read status
      const [readStatus, created] = await NoticeReadStatus.findOrCreate({
        where: { noticeId, userId },
        defaults: {
          readAt: new Date(),
          isMuted: false
        }
      });
      
      if (!created && !readStatus.readAt) {
        await readStatus.update({ readAt: new Date() });
      }
      
      return readStatus;
    } catch (error) {
      logger.error('Error marking notice as read:', error);
      throw error;
    }
  }

  // Update notice read status
  static async updateNoticeReadStatus(
    noticeId: number,
    userId: number,
    isMuted: boolean
  ): Promise<NoticeReadStatus> {
    try {
      const readStatus = await NoticeReadStatus.findOne({
        where: { noticeId, userId }
      });
      
      if (!readStatus) {
        throw new AppError('Notice not read yet', 400);
      }
      
      await readStatus.update({ isMuted });
      return readStatus;
    } catch (error) {
      logger.error('Error updating notice read status:', error);
      throw error;
    }
  }

  // Get notice by ID
  static async getNoticeById(
    noticeId: number,
    userId: number
  ): Promise<any> {
    try {
      const notice = await Notice.findByPk(noticeId, {
        include: [
          {
            model: User,
            as: 'creator',
            attributes: ['id', 'name']
          }
        ]
      });
      
      if (!notice) {
        throw new AppError('Notice not found', 404);
      }
      
      // Check if user has access
      const user = await User.findByPk(userId);
      if (!user || user.societyId !== notice.societyId) {
        throw new AppError('Unauthorized to view this notice', 403);
      }
      
      // Get read status
      const readStatus = await NoticeReadStatus.findOne({
        where: { noticeId, userId }
      });
      
      // Mark as read if not already
      if (!readStatus) {
        await this.markNoticeAsRead(noticeId, userId);
      }
      
      return {
        ...notice.toJSON(),
        isRead: !!readStatus,
        readAt: readStatus?.readAt,
        isMuted: readStatus?.isMuted || false
      };
    } catch (error) {
      logger.error('Error getting notice by ID:', error);
      throw error;
    }
  }

  // Update notice
  static async updateNotice(
    noticeId: number,
    userId: number,
    updates: Partial<{
      title: string;
      content: string;
      type: NoticeType;
      priority: NoticePriority;
      expiryDate: Date;
      isActive: boolean;
    }>
  ): Promise<Notice> {
    try {
      const notice = await Notice.findByPk(noticeId);
      
      if (!notice) {
        throw new AppError('Notice not found', 404);
      }
      
      // Check permission
      if (notice.createdBy !== userId) {
        const user = await User.findByPk(userId);
        if (!user || user.role !== UserRole.ADMIN) {
          throw new AppError('Unauthorized to update this notice', 403);
        }
      }
      
      // Update notice
      const updateData: any = { ...updates };
      if (updates.priority) {
        updateData.isCritical = updates.priority === NoticePriority.CRITICAL;
      }
      
      await notice.update(updateData);
      
      // Clear cache
      await this.cacheRecentNotices(notice.societyId);
      
      return notice;
    } catch (error) {
      logger.error('Error updating notice:', error);
      throw error;
    }
  }

  // Delete notice
  static async deleteNotice(
    noticeId: number,
    userId: number
  ): Promise<void> {
    try {
      const notice = await Notice.findByPk(noticeId);
      
      if (!notice) {
        throw new AppError('Notice not found', 404);
      }
      
      // Check permission
      if (notice.createdBy !== userId) {
        const user = await User.findByPk(userId);
        if (!user || user.role !== UserRole.ADMIN) {
          throw new AppError('Unauthorized to delete this notice', 403);
        }
      }
      
      // Soft delete
      await notice.update({ isActive: false });
      
      // Clear cache
      await this.cacheRecentNotices(notice.societyId);
      
      logger.info(`Notice deleted: ${noticeId}`);
    } catch (error) {
      logger.error('Error deleting notice:', error);
      throw error;
    }
  }

  // Send notice notifications
  private static async sendNoticeNotifications(
    notice: Notice,
    societyId: number
  ): Promise<void> {
    try {
      const notificationData = {
        type: 'new_notice',
        noticeId: notice.id.toString(),
        noticeType: notice.type,
        priority: notice.priority
      };
      
      if (notice.targetFlats && notice.targetFlats.length > 0) {
        // Send to specific flats
        const users = await User.findAll({
          where: {
            societyId,
            flatId: { [Op.in]: notice.targetFlats },
            fcmToken: { [Op.ne]: null },
            role: UserRole.RESIDENT
          },
          attributes: ['fcmToken']
        });
        
        const tokens = users.map(u => u.fcmToken).filter(Boolean) as string[];
        
        if (tokens.length > 0) {
          await sendMulticastPushNotification(
            tokens,
            notice.title,
            notice.content.substring(0, 100) + '...',
            notificationData
          );
        }
      } else if (firebaseMessaging) { // Ensure messaging is available
        // Send to all society residents
        const topic = `society_${societyId}_residents`;
        await firebaseMessaging.sendToTopic(
          topic,
          {
            notification: {
              title: notice.title,
              body: notice.content.substring(0, 100) + '...',
            },
            data: notificationData,
          }
        );
      }
    } catch (error) {
      logger.error('Error sending notice notifications:', error);
      // Don't throw - notification failure shouldn't fail notice creation
    }
  }

  // Cache recent notices
  private static async cacheRecentNotices(societyId: number): Promise<void> {
    try {
      const recentNotices = await Notice.findAll({
        where: {
          societyId,
          isActive: true,
          [Op.or]: [
            { expiryDate: null },
            { expiryDate: { [Op.gt]: new Date() } }
          ]
        },
        order: [['createdAt', 'DESC']],
        limit: 10
      });
      
      const redisKey = `notices:recent:${societyId}`;
      const expirySeconds = 3600; // 1 hour
      await redis.set(redisKey, JSON.stringify(recentNotices));
      await redis.expire(redisKey, expirySeconds);
    } catch (error) {
      logger.error('Error caching recent notices:', error);
    }
  }

  // Get recent notices from cache
  static async getRecentNotices(societyId: number): Promise<Notice[]> {
    try {
      const cached = await redis.get(`notices:recent:${societyId}`);
      if (cached) {
        return JSON.parse(cached);
      }
      
      // Fallback to database
      const notices = await Notice.findAll({
        where: {
          societyId,
          isActive: true,
          [Op.or]: [
            { expiryDate: null },
            { expiryDate: { [Op.gt]: new Date() } }
          ]
        },
        order: [['createdAt', 'DESC']],
        limit: 10
      });
      
      // Cache for next time
      await this.cacheRecentNotices(societyId);
      
      return notices;
    } catch (error) {
      logger.error('Error getting recent notices:', error);
      return [];
    }
  }
} 