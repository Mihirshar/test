import { generateUploadUrl, generateDownloadUrl, deleteFile, fileExists } from '../config/storage';
import { generateFileName } from '../utils/helpers';
import { AppError } from '../middleware/errorHandler';
import logger from '../utils/logger';

export class FileService {
  // Get presigned upload URL
  static async getUploadUrl(
    fileName: string,
    mimeType: string,
    type: 'profile' | 'visitor' | 'notice' | 'emergency' | 'receipt'
  ): Promise<{
    uploadUrl: string;
    fileKey: string;
  }> {
    try {
      // Generate unique file key with folder structure
      const extension = fileName.split('.').pop() || 'jpg';
      const fileKey = `${type}/${generateFileName(fileName, type)}`;
      
      // Generate presigned URL
      const uploadUrl = await generateUploadUrl(fileKey, mimeType);
      
      logger.info(`Generated upload URL for ${fileKey}`);
      return { uploadUrl, fileKey };
    } catch (error) {
      logger.error('Error generating upload URL:', error);
      throw new AppError('Failed to generate upload URL', 500);
    }
  }

  // Get presigned download URL
  static async getDownloadUrl(fileKey: string): Promise<string> {
    try {
      // Check if file exists
      const exists = await fileExists(fileKey);
      if (!exists) {
        throw new AppError('File not found', 404);
      }
      
      // Generate download URL
      const downloadUrl = await generateDownloadUrl(fileKey);
      
      return downloadUrl;
    } catch (error) {
      logger.error('Error generating download URL:', error);
      throw error;
    }
  }

  // Upload file from buffer (for server-side uploads)
  static async uploadFile(
    buffer: Buffer,
    fileName: string,
    mimeType: string,
    type: 'profile' | 'visitor' | 'notice' | 'emergency' | 'receipt'
  ): Promise<string> {
    try {
      const { uploadUrl, fileKey } = await this.getUploadUrl(fileName, mimeType, type);
      
      // Upload to GCS using signed URL
      const response = await fetch(uploadUrl, {
        method: 'PUT',
        headers: {
          'Content-Type': mimeType,
          'Content-Length': buffer.length.toString(),
        },
        body: buffer,
      });
      
      if (!response.ok) {
        throw new AppError('Failed to upload file', 500);
      }
      
      logger.info(`File uploaded successfully: ${fileKey}`);
      return fileKey;
    } catch (error) {
      logger.error('Error uploading file:', error);
      throw error;
    }
  }

  // Delete file
  static async deleteFile(fileKey: string): Promise<void> {
    try {
      await deleteFile(fileKey);
      logger.info(`File deleted: ${fileKey}`);
    } catch (error) {
      logger.error('Error deleting file:', error);
      // Don't throw - file deletion failure shouldn't break the flow
    }
  }

  // Upload multiple files
  static async uploadMultipleFiles(
    files: Express.Multer.File[],
    type: 'profile' | 'visitor' | 'notice' | 'emergency' | 'receipt'
  ): Promise<string[]> {
    try {
      const uploadPromises = files.map(file => 
        this.uploadFile(file.buffer, file.originalname, file.mimetype, type)
      );
      
      const fileKeys = await Promise.all(uploadPromises);
      return fileKeys;
    } catch (error) {
      logger.error('Error uploading multiple files:', error);
      throw error;
    }
  }

  // Process and optimize image
  static async processImage(
    buffer: Buffer,
    options: {
      maxWidth?: number;
      maxHeight?: number;
      quality?: number;
    } = {}
  ): Promise<Buffer> {
    try {
      // For now, return the original buffer
      // In production, use sharp or similar library to process images
      return buffer;
    } catch (error) {
      logger.error('Error processing image:', error);
      throw error;
    }
  }

  // Get file metadata
  static async getFileMetadata(fileKey: string): Promise<{
    size: number;
    contentType: string;
    created: Date;
    updated: Date;
  }> {
    try {
      const metadata = await import('../config/storage').then(m => m.getFileMetadata(fileKey));
      
      return {
        size: metadata.size,
        contentType: metadata.contentType,
        created: new Date(metadata.timeCreated),
        updated: new Date(metadata.updated),
      };
    } catch (error) {
      logger.error('Error getting file metadata:', error);
      throw error;
    }
  }

  // Validate file before upload
  static validateFile(
    file: Express.Multer.File,
    options: {
      maxSize?: number;
      allowedTypes?: string[];
    }
  ): void {
    const maxSize = options.maxSize || 10 * 1024 * 1024; // 10MB default
    const allowedTypes = options.allowedTypes || [
      'image/jpeg',
      'image/png',
      'image/gif',
      'application/pdf'
    ];
    
    if (file.size > maxSize) {
      throw new AppError(`File size exceeds ${maxSize / 1024 / 1024}MB limit`, 400);
    }
    
    if (!allowedTypes.includes(file.mimetype)) {
      throw new AppError(`File type ${file.mimetype} not allowed`, 400);
    }
  }
} 