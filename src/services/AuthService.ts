import { Op } from 'sequelize';
import jwt from 'jsonwebtoken';
import User from '../models/User';
import RefreshToken from '../models/RefreshToken';
import Society from '../models/Society';
import Flat from '../models/Flat';
import { sendOTP, verifyOTP } from '../config/twilio';
import { generateTokens } from '../middleware/auth';
import { formatPhoneNumber, parseUserAgent, generateSecureToken } from '../utils/helpers';
import { UserRole, UserStatus, JwtPayload } from '../types';
import { AppError } from '../middleware/errorHandler';
import { config } from '../config/env';
import logger from '../utils/logger';
import redis from '../config/redis';

export class AuthService {
  // Send OTP to phone number
  static async sendLoginOTP(phoneNumber: string): Promise<boolean> {
    try {
      const formattedPhone = formatPhoneNumber(phoneNumber);
      
      // Check rate limiting in Redis (only in production)
      if (config.NODE_ENV === 'production') {
        const key = `otp_sent:${formattedPhone}`;
        const count = await redis.get(key);
        if (count && parseInt(count) >= 3) {
          throw new AppError('Too many OTP requests. Please try again later', 429);
        }
        
        // Send OTP
        const sent = await sendOTP(formattedPhone);
        
        if (sent) {
          // Increment counter
          await redis.incr(key);
          await redis.expire(key, 900); // 15 minutes
          
          logger.info(`OTP sent to ${formattedPhone}`);
        }
        
        return sent;
      } else {
        // Development mode - no Redis rate limiting
        logger.info(`[DEVELOPMENT] Skipping Redis rate limiting for ${formattedPhone}`);
        const sent = await sendOTP(formattedPhone);
        
        if (sent) {
          logger.info(`OTP sent to ${formattedPhone}`);
        }
        
        return sent;
      }
    } catch (error) {
      logger.error('Error sending OTP:', error);
      throw error;
    }
  }

  // Verify OTP and login/register
  static async verifyOTPAndLogin(
    phoneNumber: string,
    otp: string,
    role?: UserRole,  // Make role optional
    deviceInfo?: any,
    fcmToken?: string,
    userAgent?: string,
    ipAddress?: string
  ): Promise<{
    user: User;
    accessToken: string;
    refreshToken: string;
    isNewUser: boolean;
  }> {
    try {
      const formattedPhone = formatPhoneNumber(phoneNumber);
      
      // Verify OTP
      const isValid = await verifyOTP(formattedPhone, otp);
      if (!isValid) {
        throw new AppError('Invalid or expired OTP', 400);
      }
      
      // Clear OTP counter (only in production)
      if (config.NODE_ENV === 'production') {
        await redis.del(`otp_sent:${formattedPhone}`);
      }
      
      // Find existing user
      let user = await User.findOne({
        where: { phoneNumber: formattedPhone },
        include: [
          { model: Society, as: 'society' },
          { model: Flat, as: 'flat' }
        ]
      });
      
      const isNewUser = !user;
      
      if (!user) {
        // Create new user with minimal info
        logger.info(`Creating new user with phone ${formattedPhone}`);
        user = await User.create({
          phoneNumber: formattedPhone,
          role: role || null, // Allow null role for new users
          status: UserStatus.PENDING_PROFILE, // New status for users who need to complete profile
          name: '',
          deviceInfo: deviceInfo || parseUserAgent(userAgent || ''),
          fcmToken,
          lastLoginAt: new Date(),
          preferences: {
            notifications: true,
            darkMode: false,
            language: 'en'
          }
        });
        
        logger.info(`New user created with ID: ${user.id}`);
      } else {
        // Existing user - check if account is active
        if (user.status === UserStatus.BLOCKED) {
          throw new AppError('Your account has been blocked. Please contact support.', 403);
        }
        
        // If role is provided, verify it matches (in production)
        if (role && config.NODE_ENV === 'production' && user.role !== role) {
          throw new AppError(`This phone number is registered as ${user.role}. Please use the correct role or contact support.`, 400);
        }
        
        // Update user info
        await user.update({
          fcmToken: fcmToken || user.fcmToken,
          deviceInfo: deviceInfo || user.deviceInfo,
          lastLoginAt: new Date()
        });
        
        logger.info(`Existing user ${user.id} logged in successfully`);
      }
      
      // Generate tokens
      const payload: JwtPayload = {
        userId: user.id,
        phoneNumber: user.phoneNumber,
        role: user.role,
        societyId: user.societyId
      };
      
      const { accessToken, refreshToken } = generateTokens(payload);
      
      // Save refresh token
      await RefreshToken.create({
        userId: user.id,
        token: refreshToken,
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
        deviceId: deviceInfo?.deviceId,
        deviceName: deviceInfo?.deviceName,
        deviceType: deviceInfo?.deviceType,
        ipAddress,
        userAgent
      });
      
      // Clean up old refresh tokens (keep last 5)
      const oldTokens = await RefreshToken.findAll({
        where: { userId: user.id },
        order: [['createdAt', 'DESC']],
        offset: 5
      });
      
      if (oldTokens.length > 0) {
        await RefreshToken.destroy({
          where: {
            id: oldTokens.map(t => t.id)
          }
        });
      }
      
      return {
        user,
        accessToken,
        refreshToken,
        isNewUser
      };
    } catch (error) {
      logger.error('Error in verifyOTPAndLogin:', error);
      throw error;
    }
  }

  // Refresh access token
  static async refreshAccessToken(
    refreshToken: string
  ): Promise<{
    accessToken: string;
    refreshToken: string;
  }> {
    try {
      // Verify refresh token
      const decoded = jwt.verify(refreshToken, config.JWT_REFRESH_SECRET) as JwtPayload;
      
      // Find refresh token in database
      const tokenRecord = await RefreshToken.findOne({
        where: {
          token: refreshToken,
          userId: decoded.userId,
          expiresAt: {
            [Op.gt]: new Date()
          }
        }
      });
      
      if (!tokenRecord) {
        throw new AppError('Invalid or expired refresh token', 401);
      }
      
      // Generate new tokens
      const { accessToken: newAccessToken, refreshToken: newRefreshToken } = generateTokens({
        userId: decoded.userId,
        phoneNumber: decoded.phoneNumber,
        role: decoded.role,
        societyId: decoded.societyId
      });
      
      // Update refresh token
      await tokenRecord.update({
        token: newRefreshToken,
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days
      });
      
      return {
        accessToken: newAccessToken,
        refreshToken: newRefreshToken
      };
    } catch (error) {
      logger.error('Error refreshing token:', error);
      throw error;
    }
  }

  // Logout
  static async logout(userId: number, refreshToken?: string): Promise<void> {
    try {
      if (refreshToken) {
        // Delete specific refresh token
        await RefreshToken.destroy({
          where: {
            userId,
            token: refreshToken
          }
        });
      } else {
        // Delete all refresh tokens for user
        await RefreshToken.destroy({
          where: { userId }
        });
      }
    } catch (error) {
      logger.error('Error logging out:', error);
      throw error;
    }
  }

  // Update FCM token
  static async updateFCMToken(userId: number, fcmToken: string): Promise<void> {
    try {
      await User.update(
        { fcmToken },
        { where: { id: userId } }
      );
    } catch (error) {
      logger.error('Error updating FCM token:', error);
      throw error;
    }
  }

  // Get active sessions
  static async getActiveSessions(userId: number): Promise<RefreshToken[]> {
    try {
      return await RefreshToken.findAll({
        where: {
          userId,
          expiresAt: {
            [Op.gt]: new Date()
          }
        },
        order: [['createdAt', 'DESC']]
      });
    } catch (error) {
      logger.error('Error getting active sessions:', error);
      throw error;
    }
  }

  // Revoke session
  static async revokeSession(userId: number, sessionId: number): Promise<void> {
    try {
      const result = await RefreshToken.destroy({
        where: {
          id: sessionId,
          userId
        }
      });
      
      if (!result) {
        throw new AppError('Session not found', 404);
      }
    } catch (error) {
      logger.error('Error revoking session:', error);
      throw error;
    }
  }
} 