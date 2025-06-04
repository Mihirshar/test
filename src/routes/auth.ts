import { Router } from 'express';
import AuthController from '../controllers/AuthController';
import { validate, schemas } from '../utils/validation';
import { authenticate } from '../middleware/auth';
import { authLimiter, otpLimiter } from '../middleware/rateLimiter';

const router = Router();

// Public routes
router.post(
  '/send-otp',
  authLimiter,
  validate(schemas.phoneLogin),
  AuthController.sendOTP
);

router.post(
  '/verify-otp',
  otpLimiter,
  validate(schemas.verifyOTP),
  AuthController.verifyOTP
);

router.post(
  '/refresh-token',
  validate(schemas.refreshToken),
  AuthController.refreshToken
);

// Protected routes
router.post(
  '/logout',
  authenticate,
  AuthController.logout
);

router.put(
  '/fcm-token',
  authenticate,
  validate(schemas.updateFCMToken),
  AuthController.updateFCMToken
);

router.get(
  '/sessions',
  authenticate,
  AuthController.getActiveSessions
);

router.delete(
  '/sessions/:sessionId',
  authenticate,
  AuthController.revokeSession
);

export default router; 