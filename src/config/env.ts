import dotenv from 'dotenv';
import path from 'path';

// Load environment variables from .env file
dotenv.config({ path: path.join(__dirname, '../../.env') });

// Validate required configuration
const validateConfig = (): void => {
  const requiredEnvVars = [
    'NODE_ENV',
    'PORT',
    'HOST',
    'JWT_SECRET',
    'JWT_REFRESH_SECRET',
  ];

  // Only require these in production
  if (process.env.NODE_ENV === 'production') {
    requiredEnvVars.push(
      'TWILIO_ACCOUNT_SID',
      'TWILIO_AUTH_TOKEN',
      'TWILIO_PHONE_NUMBER',
      'TWILIO_VERIFY_SERVICE_SID',
      'DB_PASSWORD',
      'GCP_PROJECT_ID',
      'FIREBASE_PROJECT_ID',
      'FIREBASE_PRIVATE_KEY',
      'FIREBASE_CLIENT_EMAIL'
    );
  }

  const missingVars = requiredEnvVars.filter((varName) => !process.env[varName]);

  if (missingVars.length > 0) {
    throw new Error(`Missing environment variables: ${missingVars.join(', ')}`);
  }
};

// Validate configuration
validateConfig();

// Export configuration
export const config = {
  // App
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: parseInt(process.env.PORT || '3000', 10),
  HOST: process.env.HOST || 'localhost',
  APP_NAME: process.env.APP_NAME || 'Safehood',
  APP_URL: process.env.APP_URL || 'http://localhost:3000',
  SUPPORT_EMAIL: process.env.SUPPORT_EMAIL || 'support@safehood.com',
  API_BASE_URL: process.env.API_BASE_URL || 'http://localhost:3000/api',

  // Database
  DB_HOST: process.env.DB_HOST || 'localhost',
  DB_PORT: process.env.DB_PORT || '5432',
  DB_NAME: process.env.DB_NAME || 'safehood_dev',
  DB_USER: process.env.DB_USER || 'postgres',
  DB_PASSWORD: process.env.DB_PASSWORD || '',
  DB_SSL: process.env.DB_SSL === 'true',
  DB_DIALECT: process.env.DB_DIALECT || 'postgres',

  // Redis
  REDIS_HOST: process.env.REDIS_HOST || 'localhost',
  REDIS_PORT: parseInt(process.env.REDIS_PORT || '6379', 10),
  REDIS_PASSWORD: process.env.REDIS_PASSWORD || '',
  REDIS_MOCK: process.env.REDIS_MOCK === 'true',

  // JWT
  JWT_SECRET: process.env.JWT_SECRET || 'your-secret-key',
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '7d',
  REFRESH_TOKEN_EXPIRES_IN: process.env.REFRESH_TOKEN_EXPIRES_IN || '30d',

  // Twilio
  TWILIO_ACCOUNT_SID: process.env.TWILIO_ACCOUNT_SID || '',
  TWILIO_AUTH_TOKEN: process.env.TWILIO_AUTH_TOKEN || '',
  TWILIO_PHONE_NUMBER: process.env.TWILIO_PHONE_NUMBER || '',
  TWILIO_VERIFY_SERVICE_SID: process.env.TWILIO_VERIFY_SERVICE_SID || '',

  // Google Cloud Storage
  GCP_PROJECT_ID: process.env.GCP_PROJECT_ID || '',
  GCP_BUCKET_NAME: process.env.GCP_BUCKET_NAME || '',
  GCP_KEYFILE_PATH: process.env.GCP_KEYFILE_PATH || '',

  // Firebase
  FIREBASE_PROJECT_ID: process.env.FIREBASE_PROJECT_ID || '',
  FIREBASE_PRIVATE_KEY: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n') || '',
  FIREBASE_PRIVATE_KEY_ID: process.env.FIREBASE_PRIVATE_KEY_ID || '',
  FIREBASE_CLIENT_EMAIL: process.env.FIREBASE_CLIENT_EMAIL || '',
  FIREBASE_CLIENT_ID: process.env.FIREBASE_CLIENT_ID || '',

  // CORS
  CORS_ORIGIN: (process.env.CORS_ORIGIN || 'http://localhost:3000').split(','),

  // Rate Limiting
  RATE_LIMIT_WINDOW: parseInt(process.env.RATE_LIMIT_WINDOW || '900000', 10), // 15 minutes
  RATE_LIMIT_MAX: parseInt(process.env.RATE_LIMIT_MAX || '100', 10),
  AUTH_RATE_LIMIT_MAX_REQUESTS: parseInt(process.env.AUTH_RATE_LIMIT_MAX_REQUESTS || '5', 10),
  OTP_RATE_LIMIT_MAX_REQUESTS: parseInt(process.env.OTP_RATE_LIMIT_MAX_REQUESTS || '3', 10),

  // File Upload
  UPLOAD_DIR: process.env.UPLOAD_DIR || path.join(__dirname, '../../uploads'),
  MAX_FILE_SIZE: parseInt(process.env.MAX_FILE_SIZE || '5242880', 10), // 5MB
  ALLOWED_FILE_TYPES: (process.env.ALLOWED_FILE_TYPES || 'image/jpeg,image/png,image/gif,application/pdf').split(','),

  // Emergency
  EMERGENCY_CONTACT_NUMBER: process.env.EMERGENCY_CONTACT_NUMBER || '+911234567890',
  EMERGENCY_EXPIRY_SECONDS: parseInt(process.env.EMERGENCY_EXPIRY_SECONDS || '3600', 10), // 1 hour

  // Logging
  LOG_LEVEL: process.env.LOG_LEVEL || 'info',
  LOG_FILE_PATH: process.env.LOG_FILE_PATH || 'logs/app.log',

  // Test Configuration
  TEST_PHONE: process.env.TEST_PHONE || '+918077759300',
  TEST_OTP: process.env.TEST_OTP || '123456',

  // Email
  SMTP_HOST: process.env.SMTP_HOST || '',
  SMTP_PORT: parseInt(process.env.SMTP_PORT || '587', 10),
  SMTP_USER: process.env.SMTP_USER || '',
  SMTP_PASS: process.env.SMTP_PASS || '',
  SMTP_FROM: process.env.SMTP_FROM || '',

  // Rate Limit Configuration
  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10),
    maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100', 10),
    authMaxRequests: parseInt(process.env.AUTH_RATE_LIMIT_MAX_REQUESTS || '5', 10),
    otpMaxRequests: parseInt(process.env.OTP_RATE_LIMIT_MAX_REQUESTS || '3', 10),
  },

  // CORS Configuration
  cors: {
    origin: (process.env.CORS_ORIGIN || 'http://localhost:3000').split(','),
    credentials: true
  }
}; 