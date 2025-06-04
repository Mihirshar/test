import { Router } from 'express';
import BillingController from '../controllers/BillingController';
import { authenticate, authorize } from '../middleware/auth';
import { UserRole } from '../types';

const router = Router();

// Protected routes
router.use(authenticate);

// Create maintenance bill (Admin)
router.post('/', authorize(UserRole.ADMIN), BillingController.createBill);

// Get bill by ID
router.get('/:billId', BillingController.getBill);

// Get user's bills
router.get('/user/bills', BillingController.getUserBills);

// Get society's bills (Admin)
router.get('/society/:societyId/bills', authorize(UserRole.ADMIN), BillingController.getSocietyBills);

// Update bill (Admin)
router.put('/:billId', authorize(UserRole.ADMIN), BillingController.updateBill);

// Delete bill (Admin)
router.delete('/:billId', authorize(UserRole.ADMIN), BillingController.deleteBill);

export default router;