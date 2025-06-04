import { Router } from 'express';
import VisitorController from '../controllers/VisitorController';
import { validate, validateQuery, schemas } from '../utils/validation';
import { authenticate, isResident, isGuard } from '../middleware/auth';
import { uploadVisitorPhoto } from '../middleware/upload';
import { visitorPassLimiter } from '../middleware/rateLimiter';

const router = Router();

// Resident routes
router.post(
  '/passes',
  authenticate,
  isResident,
  visitorPassLimiter,
  validate(schemas.createVisitorPass),
  VisitorController.createVisitorPass
);

router.get(
  '/passes',
  authenticate,
  isResident,
  validateQuery(schemas.pagination),
  VisitorController.getVisitorPasses
);

router.post(
  '/passes/:passId/approve',
  authenticate,
  isResident,
  VisitorController.handleVisitorApproval
);

// Guard routes
router.post(
  '/verify-otp',
  authenticate,
  isGuard,
  validate(schemas.verifyVisitorOTP),
  VisitorController.verifyVisitorOTP
);

router.put(
  '/passes/:passId/entry',
  authenticate,
  isGuard,
  uploadVisitorPhoto,
  validate(schemas.updateVisitorEntry),
  VisitorController.updateVisitorEntry
);

router.get(
  '/expected',
  authenticate,
  isGuard,
  VisitorController.getExpectedVisitors
);

router.post(
  '/request-approval',
  authenticate,
  isGuard,
  uploadVisitorPhoto,
  VisitorController.requestVisitorApproval
);

// Shared routes
router.get(
  '/passes/:passId',
  authenticate,
  VisitorController.getVisitorPassById
);

export default router; 