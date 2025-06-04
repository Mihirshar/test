import crypto from 'crypto';
import { v4 as uuidv4 } from 'uuid';
import moment from 'moment';

// Generate random OTP
export const generateOTP = (length = 6): string => {
  const digits = '0123456789';
  let otp = '';
  for (let i = 0; i < length; i++) {
    otp += digits[Math.floor(Math.random() * 10)];
  }
  return otp;
};

// Generate unique ID
export const generateUniqueId = (prefix = ''): string => {
  const timestamp = Date.now().toString(36);
  const randomStr = Math.random().toString(36).substr(2, 5);
  return prefix ? `${prefix}_${timestamp}${randomStr}` : `${timestamp}${randomStr}`;
};

// Generate bill number
export const generateBillNumber = (flatNumber: string, date: Date): string => {
  const month = moment(date).format('MMYY');
  const randomStr = Math.random().toString(36).substr(2, 4).toUpperCase();
  return `BILL-${flatNumber}-${month}-${randomStr}`;
};

// Generate transaction ID
export const generateTransactionId = (): string => {
  return `TXN-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
};

// Format phone number
export const formatPhoneNumber = (phoneNumber: string): string => {
  // Remove all non-digits
  let cleaned = phoneNumber.replace(/\D/g, '');
  
  // Add country code if not present
  if (cleaned.length === 10) {
    cleaned = '91' + cleaned; // Default to India
  }
  
  // Add + prefix
  return '+' + cleaned;
};

// Validate phone number format
export const isValidPhoneNumber = (phoneNumber: string): boolean => {
  const pattern = /^\+?[1-9]\d{9,14}$/;
  return pattern.test(phoneNumber);
};

// Generate file name for uploads
export const generateFileName = (originalName: string, prefix = 'upload'): string => {
  const ext = originalName.split('.').pop();
  const timestamp = Date.now();
  const random = crypto.randomBytes(8).toString('hex');
  return `${prefix}_${timestamp}_${random}.${ext}`;
};

// Calculate late fee
export const calculateLateFee = (amount: number, dueDate: Date, lateFeePercentage = 2): number => {
  const daysLate = moment().diff(moment(dueDate), 'days');
  if (daysLate <= 0) return 0;
  
  // 2% per month, calculated daily
  const dailyRate = lateFeePercentage / 30 / 100;
  return Math.round(amount * dailyRate * daysLate);
};

// Check if time is within validity
export const isWithinValidity = (validFrom: Date, validUntil: Date): boolean => {
  const now = new Date();
  return now >= validFrom && now <= validUntil;
};

// Get greeting based on time
export const getGreeting = (): string => {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
};

// Mask phone number
export const maskPhoneNumber = (phoneNumber: string): string => {
  if (phoneNumber.length < 10) return phoneNumber;
  const lastFour = phoneNumber.slice(-4);
  const masked = phoneNumber.slice(0, -4).replace(/\d/g, '*');
  return masked + lastFour;
};

// Generate QR code data for payment
export const generatePaymentQRData = (billNumber: string, amount: number, upiId: string): string => {
  return `upi://pay?pa=${upiId}&pn=Safehood&am=${amount}&cu=INR&tn=Bill%20${billNumber}`;
};

// Parse user agent for device info
export const parseUserAgent = (userAgent: string): any => {
  // Simple parsing - in production, use a library like ua-parser-js
  const isMobile = /Mobile|Android|iPhone/i.test(userAgent);
  const isTablet = /iPad|Tablet/i.test(userAgent);
  const isIOS = /iPhone|iPad|iPod/i.test(userAgent);
  const isAndroid = /Android/i.test(userAgent);
  
  return {
    isMobile,
    isTablet,
    isIOS,
    isAndroid,
    platform: isIOS ? 'iOS' : isAndroid ? 'Android' : 'Unknown',
    deviceType: isTablet ? 'Tablet' : isMobile ? 'Mobile' : 'Desktop',
  };
};

// Paginate query helper
export const paginateQuery = (page: number, limit: number) => {
  const offset = (page - 1) * limit;
  return { limit, offset };
};

// Sleep function for delays
export const sleep = (ms: number): Promise<void> => {
  return new Promise(resolve => setTimeout(resolve, ms));
};

// Retry function
export const retry = async <T>(
  fn: () => Promise<T>,
  retries = 3,
  delay = 1000
): Promise<T> => {
  try {
    return await fn();
  } catch (error) {
    if (retries <= 0) throw error;
    await sleep(delay);
    return retry(fn, retries - 1, delay * 2);
  }
};

// Format currency
export const formatCurrency = (amount: number, currency = 'INR'): string => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency,
  }).format(amount);
};

// Generate secure random token
export const generateSecureToken = (length = 32): string => {
  return crypto.randomBytes(length).toString('hex');
};

// Hash password (for any future password-based features)
export const hashString = (str: string): string => {
  return crypto.createHash('sha256').update(str).digest('hex');
}; 