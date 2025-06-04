import { Request } from 'express';

// User roles
export enum UserRole {
  RESIDENT = 'resident',
  GUARD = 'guard',
  SECURITY = 'security',
  ADMIN = 'admin',
  SUPER_ADMIN = 'super_admin'
}

// User status
export enum UserStatus {
  PENDING = 'pending',
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  BLOCKED = 'blocked'
}

// Visitor pass status
export enum VisitorPassStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  EXPIRED = 'expired',
  CANCELLED = 'cancelled'
}

// Notice type
export enum NoticeType {
  GENERAL = 'general',
  MAINTENANCE = 'maintenance',
  EMERGENCY = 'emergency',
  EVENT = 'event',
}

// Notice priority
export enum NoticePriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical',
}

// Emergency status
export enum EmergencyStatus {
  ACTIVE = 'active',
  RESOLVED = 'resolved',
  FALSE_ALARM = 'false_alarm'
}

// Payment status
export enum PaymentStatus {
  PENDING = 'pending',
  PAID = 'paid',
  OVERDUE = 'overdue',
  PARTIAL = 'partial',
}

// JWT token payload
export interface JwtPayload {
  id: number;
  userId: number;
  role: UserRole;
  societyId?: number;
  iat?: number;
  exp?: number;
}

// Request with user
export interface AuthRequest extends Request {
  user?: JwtPayload;
}

// API response format
export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  error?: string;
  statusCode?: number;
}

// Pagination options
export interface PaginationOptions {
  page: number;
  limit: number;
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
}

// Paginated response
export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// File upload response
export interface FileUploadResponse {
  fileName: string;
  originalName: string;
  mimeType: string;
  size: number;
  url: string;
}

// Push notification data
export interface NotificationData {
  title: string;
  body: string;
  data?: Record<string, string>;
  tokens?: string[];
  topic?: string;
} 