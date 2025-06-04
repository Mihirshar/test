import rateLimit from 'express-rate-limit';
import RedisStore from 'rate-limit-redis';
import redis from '../config/redis';
import { config } from '../config/env';
import { Request, Response } from 'express';
import { ResponseUtil } from '../utils/response';
import { RateLimitError } from '../utils/errors';

// Custom key generator based on user ID if authenticated
const keyGenerator = (req: Request): string => {
  const user = (req as any).user;
  if (user && user.userId) {
    return `user_${user.userId}`;
  }
  return req.ip || 'unknown';
};

// Custom handler for rate limit exceeded
const limitHandler = (req: Request, res: Response): void => {
  ResponseUtil.error(res, 'Too many requests, please try again later', 429);
};

// Create store function that handles Redis connection
const createStore = (prefix: string) => {
  // In development mode, use memory store to avoid Redis complications
  if (config.NODE_ENV === 'development') {
    return undefined; // Use default memory store
  }
  
  return new RedisStore({
    sendCommand: (...args: string[]) => (redis as any).call(...args),
    prefix: `rl:${prefix}:`,
  });
};

// Development vs Production rate limits
const getRateLimits = () => {
  if (config.NODE_ENV === 'development') {
    return {
      windowMs: 60 * 1000, // 1 minute window in dev
      maxRequests: 100,
      authMaxRequests: 50,
      otpMaxRequests: 20, // Much more lenient in dev
    };
  }
  
  return {
    windowMs: config.RATE_LIMIT_WINDOW_MS,
    maxRequests: config.RATE_LIMIT_MAX_REQUESTS,
    authMaxRequests: config.AUTH_RATE_LIMIT_MAX_REQUESTS,
    otpMaxRequests: config.OTP_RATE_LIMIT_MAX_REQUESTS,
  };
};

const rateLimits = getRateLimits();

// General rate limiter
export const generalLimiter = rateLimit({
  store: createStore('general'),
  windowMs: rateLimits.windowMs,
  max: rateLimits.maxRequests,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator,
  handler: limitHandler,
  skip: (req: Request) => {
    // Skip rate limiting for health checks
    return req.path === '/health' || req.path === '/metrics';
  },
});

// Default rate limiter
export const defaultLimiter = rateLimit({
  store: createStore('default'),
  windowMs: config.RATE_LIMIT_WINDOW,
  max: config.RATE_LIMIT_MAX,
  message: 'Too many requests from this IP, please try again later',
  handler: (req, res) => {
    throw new RateLimitError('Too many requests from this IP, please try again later');
  },
});

// Auth rate limiter (for login, register, etc.)
export const authLimiter = rateLimit({
  store: createStore('auth'),
  windowMs: config.RATE_LIMIT_WINDOW,
  max: config.AUTH_RATE_LIMIT_MAX_REQUESTS,
  message: 'Too many authentication attempts, please try again later',
  handler: (req, res) => {
    throw new RateLimitError('Too many authentication attempts, please try again later');
  },
});

// OTP rate limiter
export const otpLimiter = rateLimit({
  store: createStore('otp'),
  windowMs: config.RATE_LIMIT_WINDOW,
  max: config.OTP_RATE_LIMIT_MAX_REQUESTS,
  message: 'Too many OTP requests, please try again later',
  handler: (req, res) => {
    throw new RateLimitError('Too many OTP requests, please try again later');
  },
});

// File upload rate limiter
export const uploadLimiter = rateLimit({
  store: createStore('upload'),
  windowMs: 60 * 60 * 1000, // 1 hour
  max: config.NODE_ENV === 'development' ? 100 : 50, // More lenient in dev
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator,
  handler: (req: Request, res: Response) => {
    ResponseUtil.error(
      res,
      'Upload limit exceeded. Please try again later',
      429
    );
  },
});

// API endpoint specific rate limiter factory
export const createEndpointLimiter = (
  windowMs: number,
  max: number,
  prefix: string
) => {
  return rateLimit({
    store: createStore(prefix),
    windowMs: config.NODE_ENV === 'development' ? Math.min(windowMs, 60 * 1000) : windowMs, // Shorter windows in dev
    max: config.NODE_ENV === 'development' ? max * 2 : max, // Double the limits in dev
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator,
    handler: limitHandler,
  });
};

// Emergency endpoint limiter (allow more requests)
export const emergencyLimiter = createEndpointLimiter(
  60 * 1000, // 1 minute
  10, // 10 requests per minute
  'emergency'
);

// Notice creation limiter
export const noticeLimiter = createEndpointLimiter(
  60 * 60 * 1000, // 1 hour
  20, // 20 notices per hour
  'notice'
);

// Visitor pass creation limiter
export const visitorPassLimiter = createEndpointLimiter(
  60 * 60 * 1000, // 1 hour
  30, // 30 passes per hour
  'visitor'
); 