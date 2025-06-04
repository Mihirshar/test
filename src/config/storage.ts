import { Storage } from '@google-cloud/storage';
import path from 'path';
import { config } from './env';
import logger from '../utils/logger';

const isDevelopment = config.NODE_ENV === 'development';

// Initialize storage
let storage: Storage;

if (config.NODE_ENV === 'production') {
  storage = new Storage({
    projectId: config.GCP_PROJECT_ID,
    keyFilename: config.GCP_KEYFILE_PATH,
  });
} else {
  // Mock storage for development
  storage = {
    bucket: () => ({
      upload: async () => ['mock-url'],
      file: () => ({
        delete: async () => {},
        exists: async () => [true],
        download: async () => ['mock-data'],
      }),
    }),
  } as any;
  logger.info('[DEVELOPMENT] Google Cloud Storage running in mock mode');
}

// Test bucket access
export const checkBucketAccess = async (): Promise<void> => {
  try {
    if (isDevelopment) {
      logger.info('[DEVELOPMENT] Skipping GCS bucket check');
      return;
    }

    const bucket = storage.bucket(config.GCP_BUCKET_NAME);
    const [exists] = await bucket.exists();
    
    if (!exists) {
      throw new Error(`Bucket ${config.GCP_BUCKET_NAME} does not exist`);
    }
    
    logger.info('✅ GCS bucket access verified');
  } catch (error) {
    logger.error('❌ GCS bucket access failed:', error);
    throw error;
  }
};

// Upload file
export const uploadFile = async (
  file: Express.Multer.File,
  folder: string = 'uploads'
): Promise<string> => {
  try {
    if (isDevelopment) {
      return `mock-url/${file.originalname}`;
    }

    const bucket = storage.bucket(config.GCP_BUCKET_NAME);
    const fileName = `${folder}/${Date.now()}-${file.originalname}`;
    const fileUpload = bucket.file(fileName);

    const stream = fileUpload.createWriteStream({
      metadata: {
        contentType: file.mimetype,
      },
      resumable: false,
    });

    return new Promise((resolve, reject) => {
      stream.on('error', (error) => {
        reject(error);
      });

      stream.on('finish', async () => {
        const publicUrl = `https://storage.googleapis.com/${config.GCP_BUCKET_NAME}/${fileName}`;
        resolve(publicUrl);
      });

      stream.end(file.buffer);
    });
  } catch (error) {
    logger.error('❌ File upload failed:', error);
    throw error;
  }
};
// Generate pre-signed URL for uploading
export const generateUploadUrl = async (
  fileKey: string,
  mimeType: string
): Promise<string> => {
  try {
    if (isDevelopment) {
      logger.info(`[DEVELOPMENT] Mock generating upload URL for ${fileKey}`);
      return `http://localhost:mockserver/upload/${fileKey}?mimeType=${mimeType}`;
    }

    const options = {
      version: 'v4' as 'v4',
      action: 'write' as 'write',
      expires: Date.now() + 15 * 60 * 1000, // 15 minutes
      contentType: mimeType,
    };

    const bucket = storage.bucket(config.GCP_BUCKET_NAME);
    const file = bucket.file(fileKey);
    const [url] = await file.getSignedUrl(options);
    return url;
  } catch (error) {
    logger.error(`❌ Error generating upload URL for ${fileKey}:`, error);
    throw error;
  }
};
// Generate pre-signed URL for downloading
export const generateDownloadUrl = async (fileKey: string): Promise<string> => {
  try {
    if (isDevelopment) {
      logger.info(`[DEVELOPMENT] Mock generating download URL for ${fileKey}`);
      // In a real mock, you might point to a local file server or a default image
      return `http://localhost:mockserver/download/${fileKey}`;
    }

    const options = {
      version: 'v4' as 'v4',
      action: 'read' as 'read',
      expires: Date.now() + 60 * 60 * 1000, // 1 hour
    };

    const bucket = storage.bucket(config.GCP_BUCKET_NAME);
    const file = bucket.file(fileKey);
    const [url] = await file.getSignedUrl(options);
    return url;
  } catch (error) {
    logger.error(`❌ Error generating download URL for ${fileKey}:`, error);
    throw error;
  }
};
// Check if file exists
export const fileExists = async (fileKey: string): Promise<boolean> => {
  try {
    if (isDevelopment) {
      logger.info(`[DEVELOPMENT] Mock checking existence for ${fileKey} (assuming true)`);
      return true; // Or a more sophisticated mock if needed
    }

    const bucket = storage.bucket(config.GCP_BUCKET_NAME);
    const file = bucket.file(fileKey);
    const [exists] = await file.exists();
    return exists;
  } catch (error) {
    logger.error(`❌ Error checking file existence for ${fileKey}:`, error);
    // Depending on policy, you might want to return false or rethrow
    // For now, let's assume an error means we can't confirm existence, so return false.
    return false; 
  }
};

// Delete file
// Get file metadata
export const getFileMetadata = async (fileKey: string): Promise<any> => { // Consider defining a stricter return type
  try {
    if (isDevelopment) {
      logger.info(`[DEVELOPMENT] Mock getting metadata for ${fileKey}`);
      return {
        name: fileKey,
        bucket: config.GCP_BUCKET_NAME,
        generation: 'mock-generation',
        metageneration: 'mock-metageneration',
        contentType: 'application/octet-stream', // Default mock type
        timeCreated: new Date().toISOString(),
        updated: new Date().toISOString(),
        storageClass: 'STANDARD',
        timeStorageClassUpdated: new Date().toISOString(),
        size: '12345', // Mock size
        md5Hash: 'mockMd5Hash',
        contentEncoding: 'mockContentEncoding',
        contentDisposition: 'mockContentDisposition',
        crc32c: 'mockCrc32c',
        etag: 'mockEtag',
        selfLink: `http://localhost:mockserver/files/${fileKey}`,
        mediaLink: `http://localhost:mockserver/download/${fileKey}`,
      };
    }

    const bucket = storage.bucket(config.GCP_BUCKET_NAME);
    const file = bucket.file(fileKey);
    const [metadata] = await file.getMetadata();
    return metadata;
  } catch (error) {
    logger.error(`❌ Error getting file metadata for ${fileKey}:`, error);
    throw error; // Re-throw for the service to handle (e.g., as a 404 if appropriate)
  }
};
export const deleteFile = async (fileUrl: string): Promise<void> => {
  try {
    if (isDevelopment) {
      return;
    }

    const fileName = fileUrl.split(`${config.GCP_BUCKET_NAME}/`)[1];
    const bucket = storage.bucket(config.GCP_BUCKET_NAME);
    const file = bucket.file(fileName);

    await file.delete();
  } catch (error) {
    logger.error('❌ File deletion failed:', error);
    throw error;
  }
};

export default storage; 