import { Request, Response, NextFunction } from 'express';
import jwt, { SignOptions } from 'jsonwebtoken';
import { config } from '../config/env';
import User from '../models/User';
import { AuthenticationError, AuthorizationError } from '../utils/errors';
import { UserRole, JwtPayload } from '../types';

export const authenticate = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Get token from header
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      throw new AuthenticationError('No token provided');
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
      throw new AuthenticationError('No token provided');
    }

    // Verify token
    const decoded = jwt.verify(token, config.JWT_SECRET) as JwtPayload;

    // Check if user exists
    const user = await User.findByPk(decoded.userId);
    if (!user) {
      throw new AuthenticationError('User not found');
    }

    // Check if user is active
    if (user.status !== 'active') {
      throw new AuthenticationError('User account is not active');
    }

    // Add user to request
    req.user = {
      id: user.id,
      userId: user.id,
      role: user.role,
      societyId: user.societyId
    };

    next();
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      next(new AuthenticationError('Invalid token'));
    } else {
      next(error);
    }
  }
};

export const authorize = (...roles: UserRole[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      throw new AuthenticationError('User not authenticated');
    }

    if (!roles.includes(req.user.role as UserRole)) {
      throw new AuthorizationError('Not authorized to access this resource');
    }

    next();
  };
};

export const requireSociety = (req: Request, res: Response, next: NextFunction) => {
  if (!req.user) {
    throw new AuthenticationError('User not authenticated');
  }

  if (!req.user.societyId) {
    throw new AuthorizationError('User not associated with any society');
  }

  next();
};

// Check if user is resident
export const isResident = authorize(UserRole.RESIDENT, UserRole.ADMIN);

// Check if user is guard
export const isGuard = authorize(UserRole.GUARD, UserRole.ADMIN);

// Check if user is admin
export const isAdmin = authorize(UserRole.ADMIN);

// Extract token from request
const extractToken = (req: Request): string | null => {
  // Check Authorization header
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }

  // Check query parameter (for file downloads)
  if (req.query.token) {
    return req.query.token as string;
  }

  return null;
};

// Verify refresh token
export const verifyRefreshToken = async (
  token: string,
  userId: number
): Promise<RefreshToken | null> => {
  try {
    const refreshToken = await RefreshToken.findOne({
      where: {
        token,
        userId,
        isActive: true,
      },
    });

    if (!refreshToken || refreshToken.isExpired()) {
      return null;
    }

    return refreshToken;
  } catch (error) {
    return null;
  }
};

// Generate tokens
export const generateTokens = (payload: JwtPayload) => {
  const accessTokenSignOptions: SignOptions = { expiresIn: config.JWT_EXPIRES_IN as string };
  const accessToken = jwt.sign(payload, config.JWT_SECRET, accessTokenSignOptions);

  const refreshTokenSignOptions: SignOptions = { expiresIn: config.REFRESH_TOKEN_EXPIRES_IN as string };
  const refreshToken = jwt.sign(payload, config.JWT_SECRET, refreshTokenSignOptions);

  return { accessToken, refreshToken };
};

// Optional authentication (doesn't fail if no token)
export const optionalAuth = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const token = extractToken(req);
    
    if (token) {
      const decoded = jwt.verify(token, config.JWT_SECRET) as JwtPayload;
      const user = await User.findByPk(decoded.id);
      
      if (user && user.status === 'active') {
        req.user = {
          id: user.id,
          role: user.role,
          societyId: user.societyId
        };
      }
    }
    
    next();
  } catch (error) {
    // Ignore errors and continue without authentication
    next();
  }
}; 