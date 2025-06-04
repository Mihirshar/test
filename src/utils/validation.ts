import Joi from 'joi';
import { UserRole, VisitorPassStatus, NoticeType, NoticePriority } from '../types';

// Common validation patterns
export const phoneNumberPattern = /^\+?[1-9]\d{9,14}$/;
export const otpPattern = /^\d{6}$/;

// Common validation schemas
export const schemas = {
  // Auth schemas
  phoneLogin: Joi.object({
    phoneNumber: Joi.string().pattern(phoneNumberPattern).required(),
  }),

  verifyOTP: Joi.object({
    phoneNumber: Joi.string().pattern(phoneNumberPattern).required(),
    otp: Joi.string().pattern(otpPattern).required(),
    role: Joi.string().valid(...Object.values(UserRole)).optional(),
    fcmToken: Joi.string().optional(),
    deviceInfo: Joi.object({
      deviceId: Joi.string().optional(),
      deviceName: Joi.string().optional(),
      deviceType: Joi.string().optional(),
      platform: Joi.string().optional(),
      version: Joi.string().optional(),
    }).optional(),
  }),

  refreshToken: Joi.object({
    refreshToken: Joi.string().required(),
  }),

  // User schemas
  updateProfile: Joi.object({
    name: Joi.string().min(2).max(100).optional(),
    email: Joi.string().email().optional(),
    flatId: Joi.number().positive().optional(),
    preferences: Joi.object({
      notifications: Joi.boolean().optional(),
      darkMode: Joi.boolean().optional(),
      language: Joi.string().optional(),
    }).optional(),
  }),

  updateFCMToken: Joi.object({
    fcmToken: Joi.string().required(),
  }),

  // Visitor Pass schemas
  createVisitorPass: Joi.object({
    visitorName: Joi.string().min(2).max(100).required(),
    visitorPhone: Joi.string().pattern(phoneNumberPattern).required(),
    vehicleNumber: Joi.string().optional().allow(''),
    validityHours: Joi.number().min(1).max(24).required(),
    purpose: Joi.string().max(200).optional(),
    isRecurring: Joi.boolean().optional(),
    recurringDays: Joi.when('isRecurring', {
      is: true,
      then: Joi.array().items(Joi.number().min(0).max(6)).min(1).required(),
      otherwise: Joi.forbidden(),
    }),
  }),

  verifyVisitorOTP: Joi.object({
    otp: Joi.string().pattern(otpPattern).required(),
  }),

  updateVisitorEntry: Joi.object({
    action: Joi.string().valid('entry', 'exit').required(),
    photo: Joi.string().optional(), // Base64 or URL
    notes: Joi.string().max(500).optional(),
  }),

  // Notice schemas
  createNotice: Joi.object({
    title: Joi.string().min(3).max(200).required(),
    content: Joi.string().min(10).required(),
    type: Joi.string().valid(...Object.values(NoticeType)).required(),
    priority: Joi.string().valid(...Object.values(NoticePriority)).required(),
    expiryDate: Joi.date().greater('now').optional(),
    targetFlats: Joi.array().items(Joi.number().positive()).optional(),
    attachments: Joi.array().items(Joi.object({
      url: Joi.string().uri().required(),
      type: Joi.string().required(),
      name: Joi.string().required(),
    })).optional(),
  }),

  updateNoticeReadStatus: Joi.object({
    isMuted: Joi.boolean().optional(),
  }),

  // Emergency schemas
  createEmergency: Joi.object({
    description: Joi.string().max(500).optional(),
    location: Joi.object({
      lat: Joi.number().min(-90).max(90).optional(),
      lng: Joi.number().min(-180).max(180).optional(),
      address: Joi.string().optional(),
    }).optional(),
  }),

  resolveEmergency: Joi.object({
    status: Joi.string().valid('resolved', 'false_alarm').required(),
    notes: Joi.string().max(500).optional(),
  }),

  // Billing schemas
  getBills: Joi.object({
    status: Joi.string().valid('pending', 'paid', 'overdue').optional(),
    year: Joi.number().min(2020).max(2100).optional(),
    month: Joi.number().min(1).max(12).optional(),
  }),

  // Pagination
  pagination: Joi.object({
    page: Joi.number().min(1).default(1),
    limit: Joi.number().min(1).max(100).default(20),
    sortBy: Joi.string().optional(),
    sortOrder: Joi.string().valid('ASC', 'DESC').default('DESC'),
  }),

  // File upload
  fileUpload: Joi.object({
    fileName: Joi.string().required(),
    mimeType: Joi.string().required(),
    size: Joi.number().positive().required(),
  }),
};

// Validation middleware factory
export const validate = (schema: Joi.ObjectSchema) => {
  return (req: any, res: any, next: any) => {
    const { error, value } = schema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true,
    });

    if (error) {
      const errors = error.details.reduce((acc: any, detail: any) => {
        acc[detail.path.join('.')] = detail.message;
        return acc;
      }, {});
      
      return res.status(422).json({
        success: false,
        error: 'Validation failed',
        errors,
      });
    }

    req.body = value;
    next();
  };
};

// Query validation middleware
export const validateQuery = (schema: Joi.ObjectSchema) => {
  return (req: any, res: any, next: any) => {
    const { error, value } = schema.validate(req.query, {
      abortEarly: false,
      stripUnknown: true,
    });

    if (error) {
      const errors = error.details.reduce((acc: any, detail: any) => {
        acc[detail.path.join('.')] = detail.message;
        return acc;
      }, {});
      
      return res.status(422).json({
        success: false,
        error: 'Validation failed',
        errors,
      });
    }

    req.query = value;
    next();
  };
}; 