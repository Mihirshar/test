import { Router, Request, Response } from 'express';
import authRoutes from './auth';
import userRoutes from './user';
import visitorRoutes from './visitor';
import noticeRoutes from './notice';
import emergencyRoutes from './emergency';
import billingRoutes from './billing';
import { FileService } from '../services/FileService';
import { authenticate } from '../middleware/auth';
import { uploadLimiter } from '../middleware/rateLimiter';
import { validate, schemas } from '../utils/validation';
import { ResponseUtil } from '../utils/response';
import { asyncHandler } from '../middleware/errorHandler';
import { AuthRequest } from '../types';
import SocietyController from '../controllers/SocietyController';

const router = Router();

// Health check
router.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'Safehood Backend',
    version: '1.0.0',
  });
});

// File upload URL generation
router.post(
  '/upload-url',
  authenticate,
  uploadLimiter,
  validate(schemas.fileUpload),
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const { fileName, mimeType, type } = req.body;
    
    const result = await FileService.getUploadUrl(
      fileName,
      mimeType,
      type || 'general'
    );
    
    ResponseUtil.success(res, result);
  })
);

// Mount route modules
router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/visitors', visitorRoutes);
router.use('/notices', noticeRoutes);
router.use('/emergencies', emergencyRoutes);
router.use('/billing', billingRoutes);

// Society routes
router.get('/societies', authenticate, SocietyController.getSocieties);
router.get('/societies/:id/flats', authenticate, SocietyController.getFlats);

export default router; 