import { Router } from 'express';
import NoticeController from '../controllers/NoticeController';
import { validate, validateQuery, schemas } from '../utils/validation';
import { authenticate, isAdmin } from '../middleware/auth';
import { uploadNoticeAttachments } from '../middleware/upload';
import { noticeLimiter } from '../middleware/rateLimiter';

const router = Router();

// Admin routes
router.post(
  '/',
  authenticate,
  isAdmin,
  noticeLimiter,
  uploadNoticeAttachments,
  validate(schemas.createNotice),
  NoticeController.createNotice
);

router.put(
  '/:noticeId',
  authenticate,
  isAdmin,
  NoticeController.updateNotice
);

router.delete(
  '/:noticeId',
  authenticate,
  isAdmin,
  NoticeController.deleteNotice
);

// User routes
router.get(
  '/',
  authenticate,
  validateQuery(schemas.pagination),
  NoticeController.getNotices
);

router.get(
  '/recent',
  authenticate,
  NoticeController.getRecentNotices
);

router.get(
  '/:noticeId',
  authenticate,
  NoticeController.getNoticeById
);

router.post(
  '/:noticeId/read',
  authenticate,
  NoticeController.markNoticeAsRead
);

router.put(
  '/:noticeId/status',
  authenticate,
  validate(schemas.updateNoticeReadStatus),
  NoticeController.updateNoticeReadStatus
);

export default router; 