import { Router } from 'express';
import EmergencyController from '../controllers/EmergencyController';
import { validate, validateQuery, schemas } from '../utils/validation';
import { authenticate, isResident, isGuard, isAdmin } from '../middleware/auth';
import { emergencyLimiter } from '../middleware/rateLimiter';

const router = Router();

// Resident routes
router.post(
  '/',
  authenticate,
  isResident,
  emergencyLimiter,
  validate(schemas.createEmergency),
  EmergencyController.createEmergency
);

// Guard/Admin routes
router.get(
  '/active',
  authenticate,
  isGuard,
  EmergencyController.getActiveEmergencies
);

router.put(
  '/:emergencyId/resolve',
  authenticate,
  isGuard,
  validate(schemas.resolveEmergency),
  EmergencyController.resolveEmergency
);

// Shared routes
router.get(
  '/history',
  authenticate,
  validateQuery(schemas.pagination),
  EmergencyController.getEmergencyHistory
);

router.get(
  '/:emergencyId',
  authenticate,
  EmergencyController.getEmergencyById
);

// Admin only routes
router.post(
  '/test',
  authenticate,
  isAdmin,
  EmergencyController.testEmergency
);

export default router; 