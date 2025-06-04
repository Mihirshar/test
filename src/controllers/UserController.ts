import { Request, Response } from 'express';
import { FileService } from '../services/FileService';
import { ResponseUtil } from '../utils/response';
import { asyncHandler } from '../middleware/errorHandler';
import { AuthRequest } from '../types/express';
import User from '../models/User';
import Society from '../models/Society';
import Flat from '../models/Flat';
import UserService from '../services/UserService';
import { UserUpdateData, UserRole } from '../types';

export default class UserController {
  // Get user profile
  static getProfile = asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = req.user!.id;
    const user = await UserService.getUserProfile(userId);
    return res.json({ success: true, data: user });
  });

  // Update user profile
  static updateProfile = asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = req.user!.id;
    const updateData: UserUpdateData = req.body;
    const updatedUser = await UserService.updateUserProfile(userId, updateData);
    return res.json({ success: true, data: updatedUser });
  });

  // Get user dashboard data
  static getDashboard = asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = req.user!.id;
    const userRole = req.user!.role;

    let dashboardData;
    if (userRole === UserRole.RESIDENT) {
      dashboardData = await UserService.getResidentDashboard(userId);
    } else if (userRole === UserRole.GUARD || userRole === UserRole.SECURITY) {
      dashboardData = await UserService.getSecurityDashboard(userId);
    } else if (userRole === UserRole.ADMIN || userRole === UserRole.SUPER_ADMIN) {
      dashboardData = await UserService.getAdminDashboard(userId);
    }

    return res.json({ success: true, data: dashboardData });
  });

  // Get all residents (Guard/Admin)
  static getResidents = asyncHandler(async (req: AuthRequest, res: Response) => {
    const societyId = req.user!.societyId;
    if (!societyId) {
      return res.status(400).json({ success: false, message: 'Society ID not found' });
    }

    const residents = await UserService.getSocietyResidents(societyId);
    return res.json({ success: true, data: residents });
  });

  // Update user preferences
  static updatePreferences = asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = req.user!.userId;
    const { preferences } = req.body;
    
    await User.update(
      { preferences },
      { where: { id: userId } }
    );
    
    ResponseUtil.success(res, null, 'Preferences updated successfully');
  });

  // Delete profile picture
  static deleteProfilePicture = asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = req.user!.id;
    await UserService.deleteProfilePicture(userId);
    return res.json({ success: true, message: 'Profile picture deleted successfully' });
  });

  static getNotifications = asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = req.user!.id;
    const notifications = await UserService.getUserNotifications(userId);
    return res.json({ success: true, data: notifications });
  });

  static updateNotificationSettings = asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = req.user!.id;
    const settings = req.body;
    const updatedSettings = await UserService.updateNotificationSettings(userId, settings);
    return res.json({ success: true, data: updatedSettings });
  });

  static getDevices = asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = req.user!.id;
    const devices = await UserService.getUserDevices(userId);
    return res.json({ success: true, data: devices });
  });

  static addDevice = asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = req.user!.id;
    const deviceData = req.body;
    const device = await UserService.addUserDevice(userId, deviceData);
    return res.json({ success: true, data: device });
  });

  static removeDevice = asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = req.user!.id;
    const { deviceId } = req.params;
    await UserService.removeUserDevice(userId, deviceId);
    return res.json({ success: true, message: 'Device removed successfully' });
  });
} 