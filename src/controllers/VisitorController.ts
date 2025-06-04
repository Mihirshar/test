import { Request, Response } from 'express';
import { VisitorService } from '../services/VisitorService';
import { FileService } from '../services/FileService';
import { ResponseUtil } from '../utils/response';
import { asyncHandler } from '../middleware/errorHandler';
import { AuthRequest } from '../types';
import { paginateQuery } from '../utils/helpers';

export default class VisitorController {
  // Create visitor pass (Resident)
  static createVisitorPass = asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = req.user!.userId;
    const data = req.body;
    
    const visitorPass = await VisitorService.createVisitorPass(userId, data);
    
    ResponseUtil.success(res, {
      id: visitorPass.id,
      otp: visitorPass.otp,
      visitorName: visitorPass.visitorName,
      validUntil: visitorPass.validUntil,
    }, 'Visitor pass created successfully', 201);
  });

  // Get visitor passes (Resident)
  static getVisitorPasses = asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = req.user!.userId;
    const { status, fromDate, toDate, page = 1, limit = 20 } = req.query;
    
    const filters = {
      status: status as any,
      fromDate: fromDate ? new Date(fromDate as string) : undefined,
      toDate: toDate ? new Date(toDate as string) : undefined,
      page: parseInt(page as string),
      limit: parseInt(limit as string),
    };
    
    const result = await VisitorService.getVisitorPasses(userId, filters);
    
    ResponseUtil.paginated(
      res,
      result.passes,
      result.total,
      filters.page,
      filters.limit
    );
  });

  // Verify visitor OTP (Guard)
  static verifyVisitorOTP = asyncHandler(async (req: AuthRequest, res: Response) => {
    const guardId = req.user!.userId;
    const { otp } = req.body;
    
    const result = await VisitorService.verifyVisitorOTP(otp, guardId);
    
    ResponseUtil.success(res, {
      visitorPass: {
        id: result.visitorPass.id,
        visitorName: result.visitorPass.visitorName,
        visitorPhone: result.visitorPass.visitorPhone,
        vehicleNumber: result.visitorPass.vehicleNumber,
        purpose: result.visitorPass.purpose,
        validUntil: result.visitorPass.validUntil,
      },
      resident: {
        id: result.resident.id,
        name: result.resident.name,
        flatNumber: result.resident.flat?.number,
        phoneNumber: result.resident.phone,
      },
    }, 'OTP verified successfully');
  });

  // Update visitor entry/exit (Guard)
  static updateVisitorEntry = asyncHandler(async (req: AuthRequest, res: Response) => {
    const guardId = req.user!.userId;
    const { passId } = req.params;
    const { action, notes } = req.body;
    let photo: string | undefined;
    
    // Handle photo upload if provided
    if (req.file) {
      photo = await FileService.uploadFile(
        req.file.buffer,
        req.file.originalname,
        req.file.mimetype,
        'visitor'
      );
    }
    
    const visitorPass = await VisitorService.updateVisitorEntry(
      parseInt(passId),
      guardId,
      action,
      photo,
      notes
    );
    
    ResponseUtil.success(res, visitorPass, `Visitor ${action} recorded successfully`);
  });

  // Get expected visitors (Guard)
  static getExpectedVisitors = asyncHandler(async (req: AuthRequest, res: Response) => {
    const user = req.user!;
    const { date } = req.query;
    
    // Get guard's society ID
    const societyId = user.societyId!;
    
    const visitors = await VisitorService.getExpectedVisitors(
      societyId,
      date ? new Date(date as string) : undefined
    );
    
    ResponseUtil.success(res, visitors);
  });

  // Request visitor approval (Guard)
  static requestVisitorApproval = asyncHandler(async (req: AuthRequest, res: Response) => {
    const guardId = req.user!.userId;
    const { residentId, visitorData } = req.body;
    let photo: string | undefined;
    
    // Handle photo upload if provided
    if (req.file) {
      photo = await FileService.uploadFile(
        req.file.buffer,
        req.file.originalname,
        req.file.mimetype,
        'visitor'
      );
      visitorData.photo = photo;
    }
    
    const visitorPass = await VisitorService.requestVisitorApproval(
      guardId,
      residentId,
      visitorData
    );
    
    ResponseUtil.success(res, {
      id: visitorPass.id,
      status: visitorPass.status,
    }, 'Approval request sent to resident', 201);
  });

  // Approve/reject visitor (Resident)
  static handleVisitorApproval = asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = req.user!.userId;
    const { passId } = req.params;
    const { approved, reason } = req.body;
    
    const visitorPass = await VisitorService.handleVisitorApproval(
      parseInt(passId),
      userId,
      approved,
      reason
    );
    
    ResponseUtil.success(
      res,
      visitorPass,
      approved ? 'Visitor approved' : 'Visitor rejected'
    );
  });

  // Get visitor by pass ID
  static getVisitorPassById = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { passId } = req.params;
    const user = req.user!; // Authenticated user

    const visitorPass = await VisitorService.getVisitorPassById(
      parseInt(passId),
      user.userId,
      user.role,
      user.societyId
    );
    
    ResponseUtil.success(res, visitorPass);
  });
} 