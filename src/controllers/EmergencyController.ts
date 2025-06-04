import { Request, Response } from 'express';
import { EmergencyService } from '../services/EmergencyService';
import { ResponseUtil } from '../utils/response';
import { asyncHandler } from '../middleware/errorHandler';
import { AuthRequest } from '../types/express';
import User from '../models/User';
import { EmergencyData, EmergencyStatus } from '../types';

export default class EmergencyController {
  // Create emergency alert (Resident)
  static createEmergency = asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = req.user!.userId;
    const data = req.body;
    
    const emergency = await EmergencyService.createEmergency(userId, data);
    
    ResponseUtil.success(res, {
      id: emergency.id,
      status: emergency.status,
      createdAt: emergency.createdAt,
    }, 'Emergency alert sent successfully', 201);
  });

  // Resolve emergency (Guard/Admin)
  static resolveEmergency = asyncHandler(async (req: AuthRequest, res: Response) => {
    const emergencyId = parseInt(req.params.emergencyId, 10);
    const userId = req.user!.id;
    const { status = EmergencyStatus.RESOLVED, notes } = req.body;
    await EmergencyService.resolveEmergency(emergencyId, userId, status, notes);
    return res.json({ success: true, message: 'Emergency resolved successfully' });
  });

  // Get active emergencies (Guard/Admin)
  static getActiveEmergencies = asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = req.user!.id;
    const emergencies = await EmergencyService.getActiveEmergencies(userId);
    return res.json({ success: true, data: emergencies });
  });

  // Get emergency history
  static getEmergencyHistory = asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = req.user!.id;
    const filters = {
      userId,
      status: req.query.status as EmergencyStatus,
      fromDate: req.query.fromDate ? new Date(req.query.fromDate as string) : undefined,
      toDate: req.query.toDate ? new Date(req.query.toDate as string) : undefined,
      page: parseInt(req.query.page as string) || 1,
      limit: parseInt(req.query.limit as string) || 20,
    };
    const history = await EmergencyService.getEmergencyHistory(filters);
    return res.json({ success: true, data: history });
  });

  // Get emergency details
  static getEmergencyById = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { emergencyId } = req.params;
    
    // This would need a service method to get emergency by ID with proper access checks
    ResponseUtil.success(res, null, 'Not implemented');
  });

  // Test emergency system (Admin only)
  static testEmergency = asyncHandler(async (req: AuthRequest, res: Response) => {
    // Create a test emergency that auto-resolves after 1 minute
    const testData = {
      description: 'This is a test emergency alert',
      location: {
        address: 'Test Location',
      },
    };
    
    const emergency = await EmergencyService.createEmergency(req.user!.userId, testData);
    
    // Auto-resolve after 1 minute
    setTimeout(async () => {
      try {
        await EmergencyService.resolveEmergency(
          emergency.id,
          req.user!.userId,
          'resolved',
          'Test emergency auto-resolved'
        );
      } catch (error) {
        // Ignore errors
      }
    }, 60000);
    
    ResponseUtil.success(res, {
      id: emergency.id,
      message: 'Test emergency created. Will auto-resolve in 1 minute.',
    }, 'Test emergency created', 201);
  });

  static reportEmergency = asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = req.user!.id;
    const emergencyData: EmergencyData = req.body;
    const emergency = await EmergencyService.createEmergency(userId, emergencyData);
    return res.json({ success: true, data: emergency });
  });

  static getSocietyEmergencies = asyncHandler(async (req: AuthRequest, res: Response) => {
    const societyId = parseInt(req.params.societyId, 10);
    const emergencies = await EmergencyService.getActiveEmergencies(societyId);
    return res.json({ success: true, data: emergencies });
  });
} 