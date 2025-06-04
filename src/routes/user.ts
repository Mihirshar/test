import { Router } from 'express';
import UserController from '../controllers/UserController';
import { validate, validateQuery, schemas } from '../utils/validation';
import { authenticate, isGuard } from '../middleware/auth';
import { uploadProfilePicture } from '../middleware/upload';

const router = Router();

// Profile routes
router.get(
  '/profile',
  authenticate,
  UserController.getProfile
);

router.put(
  '/profile',
  authenticate,
  uploadProfilePicture,
  validate(schemas.updateProfile),
  UserController.updateProfile
);

router.delete(
  '/profile/picture',
  authenticate,
  UserController.deleteProfilePicture
);

router.put(
  '/preferences',
  authenticate,
  UserController.updatePreferences
);

// Dashboard
router.get(
  '/dashboard',
  authenticate,
  UserController.getDashboard
);

// Guard/Admin routes
router.get(
  '/residents',
  authenticate,
  isGuard,
  validateQuery(schemas.pagination),
  UserController.getResidents
);

export default router; 