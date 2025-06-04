import { Request, Response } from 'express';
import { BillingService } from '../services/BillingService';
import { FileService } from '../services/FileService';
import { ResponseUtil } from '../utils/response';
import { asyncHandler } from '../middleware/errorHandler';
import { AuthRequest } from '../types/express';
import User from '../models/User';
import { BillCreateData } from '../types/billing';

export default class BillingController {
  // Create maintenance bill (Admin)
  static createBill = asyncHandler(async (req: AuthRequest, res: Response) => {
    const billData: BillCreateData = req.body;
    const user = await User.findByPk(req.user!.userId);
    
    if (!user || !user.societyId) {
      return ResponseUtil.error(res, 'User not associated with any society', 400);
    }
    
    const bill = await BillingService.createBill(billData);
    
    return res.json({ success: true, data: bill });
  });

  // Get bills for resident
  static getBills = asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = req.user!.userId;
    const { status, year, month, page = 1, limit = 20 } = req.query;
    
    const filters = {
      status: status as any,
      year: year ? parseInt(year as string) : undefined,
      month: month ? parseInt(month as string) : undefined,
      page: parseInt(page as string),
      limit: parseInt(limit as string),
    };
    
    const result = await BillingService.getBillsForResident(userId, filters);
    
    ResponseUtil.success(res, {
      bills: result.bills,
      pagination: {
        total: result.total,
        page: filters.page,
        limit: filters.limit,
        totalPages: Math.ceil(result.total / filters.limit),
      },
      summary: {
        totalDue: result.totalDue,
      },
    });
  });

  // Get bill by ID
  static getBillById = asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = req.user!.userId;
    const { billId } = req.params;
    
    const bill = await BillingService.getBillById(
      parseInt(billId),
      userId
    );
    
    // Generate QR code image URL if needed
    // This could be done on the frontend using the qrCode data
    
    ResponseUtil.success(res, bill);
  });

  // Record payment (Admin)
  static recordPayment = asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = req.user!.userId;
    const { billId } = req.params;
    const data = req.body;
    let receiptUrl: string | undefined;
    
    // Handle receipt upload if provided
    if (req.file) {
      receiptUrl = await FileService.uploadFile(
        req.file.buffer,
        req.file.originalname,
        req.file.mimetype,
        'receipt'
      );
      data.receiptUrl = receiptUrl;
    }
    
    const payment = await BillingService.recordPayment(
      parseInt(billId),
      userId,
      data
    );
    
    ResponseUtil.success(res, payment, 'Payment recorded successfully', 201);
  });

  // Get payment history
  static getPaymentHistory = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { userId, flatId, fromDate, toDate, page = 1, limit = 20 } = req.query;
    
    const filters = {
      userId: userId ? parseInt(userId as string) : undefined,
      flatId: flatId ? parseInt(flatId as string) : undefined,
      fromDate: fromDate ? new Date(fromDate as string) : undefined,
      toDate: toDate ? new Date(toDate as string) : undefined,
      page: parseInt(page as string),
      limit: parseInt(limit as string),
    };
    
    const result = await BillingService.getPaymentHistory(filters);
    
    ResponseUtil.success(res, {
      payments: result.payments,
      pagination: {
        total: result.total,
        page: filters.page,
        limit: filters.limit,
        totalPages: Math.ceil(result.total / filters.limit),
      },
      summary: {
        totalAmount: result.totalAmount,
      },
    });
  });

  // Send bill reminders (Admin)
  static sendBillReminders = asyncHandler(async (req: AuthRequest, res: Response) => {
    await BillingService.sendBillReminders();
    
    ResponseUtil.success(res, null, 'Bill reminders sent successfully');
  });

  // Get billing summary for dashboard
  static getBillingSummary = asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = req.user!.userId;
    
    // Get current month bills
    const currentMonth = new Date().getMonth() + 1;
    const currentYear = new Date().getFullYear();
    
    const result = await BillingService.getBillsForResident(userId, {
      year: currentYear,
      month: currentMonth,
      page: 1,
      limit: 1,
    });
    
    ResponseUtil.success(res, {
      currentMonthDue: result.totalDue,
      hasPendingBills: result.total > 0,
      latestBill: result.bills[0] || null,
    });
  });

  static getBill = asyncHandler(async (req: AuthRequest, res: Response) => {
    const billId = parseInt(req.params.billId, 10);
    const bill = await BillingService.getBill(billId);
    return res.json({ success: true, data: bill });
  });

  static getUserBills = asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = req.user!.id;
    const bills = await BillingService.getUserBills(userId);
    return res.json({ success: true, data: bills });
  });

  static getSocietyBills = asyncHandler(async (req: AuthRequest, res: Response) => {
    const societyId = parseInt(req.params.societyId, 10);
    const bills = await BillingService.getSocietyBills(societyId);
    return res.json({ success: true, data: bills });
  });

  static updateBill = asyncHandler(async (req: AuthRequest, res: Response) => {
    const billId = parseInt(req.params.billId, 10);
    const updateData = req.body;
    const bill = await BillingService.updateBill(billId, updateData);
    return res.json({ success: true, data: bill });
  });

  static deleteBill = asyncHandler(async (req: AuthRequest, res: Response) => {
    const billId = parseInt(req.params.billId, 10);
    await BillingService.deleteBill(billId);
    return res.json({ success: true, message: 'Bill deleted successfully' });
  });
} 