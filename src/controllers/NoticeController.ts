import { Request, Response } from 'express';
import { NoticeService } from '../services/NoticeService';
import { FileService } from '../services/FileService';
import { ResponseUtil } from '../utils/response';
import { asyncHandler } from '../middleware/errorHandler';
import { AuthRequest } from '../types';
import User from '../models/User';

export default class NoticeController {
  // Create notice (Admin)
  static createNotice = asyncHandler(async (req: AuthRequest, res: Response) => {
    const createdBy = req.user!.userId;
    const data = req.body;
    let attachments: any[] = [];
    
    // Get user's society ID
    const user = await User.findByPk(createdBy);
    if (!user || !user.societyId) {
      return ResponseUtil.error(res, 'User not associated with any society', 400);
    }
    
    // Handle file uploads if provided
    if (req.files && Array.isArray(req.files)) {
      const fileKeys = await FileService.uploadMultipleFiles(req.files, 'notice');
      attachments = req.files.map((file, index) => ({
        url: fileKeys[index],
        type: file.mimetype,
        name: file.originalname,
      }));
      data.attachments = attachments;
    }
    
    const notice = await NoticeService.createNotice(
      createdBy,
      user.societyId,
      data
    );
    
    ResponseUtil.success(res, notice, 'Notice created successfully', 201);
  });

  // Get notices
  static getNotices = asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = req.user!.userId;
    const { type, unreadOnly, page = 1, limit = 20 } = req.query;
    
    const filters = {
      type: type as any,
      unreadOnly: unreadOnly === 'true',
      page: parseInt(page as string),
      limit: parseInt(limit as string),
    };
    
    const result = await NoticeService.getNotices(userId, filters);
    
    ResponseUtil.paginated(
      res,
      result.notices,
      result.total,
      filters.page,
      filters.limit
    );
  });

  // Get notice by ID
  static getNoticeById = asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = req.user!.userId;
    const { noticeId } = req.params;
    
    const notice = await NoticeService.getNoticeById(
      parseInt(noticeId),
      userId
    );
    
    // Generate download URLs for attachments
    if (notice.attachments && notice.attachments.length > 0) {
      const attachmentsWithUrls = await Promise.all(
        notice.attachments.map(async (attachment: any) => ({
          ...attachment,
          downloadUrl: await FileService.getDownloadUrl(attachment.url),
        }))
      );
      notice.attachments = attachmentsWithUrls;
    }
    
    ResponseUtil.success(res, notice);
  });

  // Mark notice as read
  static markNoticeAsRead = asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = req.user!.userId;
    const { noticeId } = req.params;
    
    await NoticeService.markNoticeAsRead(
      parseInt(noticeId),
      userId
    );
    
    ResponseUtil.success(res, null, 'Notice marked as read');
  });

  // Update notice read status (mute/unmute)
  static updateNoticeReadStatus = asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = req.user!.userId;
    const { noticeId } = req.params;
    const { isMuted } = req.body;
    
    const readStatus = await NoticeService.updateNoticeReadStatus(
      parseInt(noticeId),
      userId,
      isMuted
    );
    
    ResponseUtil.success(res, readStatus, 'Notice status updated');
  });

  // Update notice (Admin)
  static updateNotice = asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = req.user!.userId;
    const { noticeId } = req.params;
    const updates = req.body;
    
    const notice = await NoticeService.updateNotice(
      parseInt(noticeId),
      userId,
      updates
    );
    
    ResponseUtil.success(res, notice, 'Notice updated successfully');
  });

  // Delete notice (Admin)
  static deleteNotice = asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = req.user!.userId;
    const { noticeId } = req.params;
    
    await NoticeService.deleteNotice(
      parseInt(noticeId),
      userId
    );
    
    ResponseUtil.success(res, null, 'Notice deleted successfully');
  });

  // Get recent notices
  static getRecentNotices = asyncHandler(async (req: AuthRequest, res: Response) => {
    const user = await User.findByPk(req.user!.userId);
    if (!user || !user.societyId) {
      return ResponseUtil.error(res, 'User not associated with any society', 400);
    }
    
    const notices = await NoticeService.getRecentNotices(user.societyId);
    
    ResponseUtil.success(res, notices);
  });
} 