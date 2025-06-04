import multer from 'multer';
import { Request } from 'express';
import { config } from '../config/env';
import { AppError } from './errorHandler';

// File filter function
const fileFilter = (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  // Check file type
  if (!config.ALLOWED_FILE_TYPES.includes(file.mimetype)) {
    cb(new AppError(`File type ${file.mimetype} not allowed`, 400));
    return;
  }
  
  cb(null, true);
};

// Configure multer for memory storage (will upload to GCS)
const storage = multer.memoryStorage();

// Create multer instance
const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: config.MAX_FILE_SIZE,
    files: 5, // Max 5 files per request
  },
});

// Export upload middleware functions
export const uploadSingle = (fieldName: string) => upload.single(fieldName);
export const uploadMultiple = (fieldName: string, maxCount: number) => upload.array(fieldName, maxCount);
export const uploadFields = (fields: multer.Field[]) => upload.fields(fields);

// Specific upload configurations
export const uploadProfilePicture = uploadSingle('profilePicture');
export const uploadVisitorPhoto = uploadSingle('photo');
export const uploadNoticeAttachments = uploadMultiple('attachments', 3);
export const uploadBillReceipt = uploadSingle('receipt');

// Helper to validate uploaded file
export const validateUploadedFile = (file: Express.Multer.File, options: {
  maxSize?: number;
  allowedTypes?: string[];
} = {}): void => {
  const maxSize = options.maxSize || config.MAX_FILE_SIZE;
  const allowedTypes = options.allowedTypes || config.ALLOWED_FILE_TYPES;
  
  if (file.size > maxSize) {
    throw new AppError(`File size exceeds ${maxSize} bytes`, 400);
  }
  
  if (!allowedTypes.includes(file.mimetype)) {
    throw new AppError(`File type ${file.mimetype} not allowed`, 400);
  }
};

// Image-specific validation
export const validateImageFile = (file: Express.Multer.File): void => {
  const imageTypes = ['image/jpeg', 'image/png', 'image/gif'];
  validateUploadedFile(file, {
    maxSize: 5 * 1024 * 1024, // 5MB for images
    allowedTypes: imageTypes,
  });
};

// PDF-specific validation
export const validatePdfFile = (file: Express.Multer.File): void => {
  validateUploadedFile(file, {
    maxSize: 10 * 1024 * 1024, // 10MB for PDFs
    allowedTypes: ['application/pdf'],
  });
}; 