import { Request, Response } from 'express';
import { AuthService } from '../services/AuthService';
import { ResponseUtil } from '../utils/response';
import { asyncHandler } from '../middleware/errorHandler';
import { AuthRequest } from '../types';

export default class AuthController {
  // Send OTP
  static sendOTP = asyncHandler(async (req: Request, res: Response) => {
    const { phoneNumber } = req.body;
    
    const result = await AuthService.sendLoginOTP(phoneNumber);
    
    if (result) {
      ResponseUtil.success(res, null, 'OTP sent successfully');
    } else {
      ResponseUtil.error(res, 'Failed to send OTP', 500);
    }
  });

  // Verify OTP and login
  static verifyOTP = asyncHandler(async (req: Request, res: Response) => {
    const { phoneNumber, otp, role, fcmToken, deviceInfo } = req.body;
    const userAgent = req.headers['user-agent'];
    const ipAddress = req.ip;
    
    const result = await AuthService.verifyOTPAndLogin(
      phoneNumber,
      otp,
      role,
      deviceInfo,
      fcmToken,
      userAgent,
      ipAddress
    );
    
    // Determine user state and next steps
    const isProfileComplete = !!(result.user.name && result.user.name.trim().length > 0);
    const hasRole = !!result.user.role;
    const needsSocietyAssignment = !result.user.societyId;
    const needsFlatAssignment = result.user.role === 'resident' && !result.user.flatId;
    
    // Prepare response message based on user state
    let message = 'Authentication successful';
    let nextRoute = '/dashboard';
    
    if (result.isNewUser || !hasRole) {
      message = 'Welcome! Please complete your account setup.';
      nextRoute = '/account-setup';
    } else if (!isProfileComplete) {
      message = 'Please complete your profile.';
      nextRoute = '/complete-profile';
    } else if (needsSocietyAssignment) {
      message = 'Please select your society.';
      nextRoute = '/select-society';
    } else if (needsFlatAssignment) {
      message = 'Please select your flat.';
      nextRoute = '/select-flat';
    }
    
    ResponseUtil.success(res, {
      user: {
        id: result.user.id,
        name: result.user.name,
        phoneNumber: result.user.phoneNumber,
        role: result.user.role,
        status: result.user.status,
        societyId: result.user.societyId,
        flatId: result.user.flatId,
        email: result.user.email,
        profilePicture: result.user.profilePicture,
        preferences: result.user.preferences,
        isProfileComplete,
        hasRole,
        needsSocietyAssignment,
        needsFlatAssignment,
        createdAt: result.user.createdAt,
        lastLoginAt: result.user.lastLoginAt
      },
      accessToken: result.accessToken,
      refreshToken: result.refreshToken,
      isNewUser: result.isNewUser,
      nextSteps: {
        completeProfile: !isProfileComplete,
        selectRole: !hasRole,
        assignSociety: needsSocietyAssignment,
        assignFlat: needsFlatAssignment
      },
      nextRoute
    }, message);
  });

  // Refresh token
  static refreshToken = asyncHandler(async (req: Request, res: Response) => {
    const { refreshToken } = req.body;
    
    const tokens = await AuthService.refreshAccessToken(refreshToken);
    
    ResponseUtil.success(res, tokens, 'Token refreshed successfully');
  });

  // Logout
  static logout = asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = req.user!.userId;
    const { refreshToken } = req.body;
    
    await AuthService.logout(userId, refreshToken);
    
    ResponseUtil.success(res, null, 'Logged out successfully');
  });

  // Update FCM token
  static updateFCMToken = asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = req.user!.userId;
    const { fcmToken } = req.body;
    
    await AuthService.updateFCMToken(userId, fcmToken);
    
    ResponseUtil.success(res, null, 'FCM token updated successfully');
  });

  // Get active sessions
  static getActiveSessions = asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = req.user!.userId;
    
    const sessions = await AuthService.getActiveSessions(userId);
    
    ResponseUtil.success(res, sessions);
  });

  // Revoke session
  static revokeSession = asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = req.user!.userId;
    const { sessionId } = req.params;
    
    await AuthService.revokeSession(userId, parseInt(sessionId));
    
    ResponseUtil.success(res, null, 'Session revoked successfully');
  });
} 