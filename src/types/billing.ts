export interface BillCreateData {
  flatId: number;
  amount: number;
  dueDate: Date;
  description: string;
  category: string;
  status?: string;
  metadata?: Record<string, any>;
}

export interface BillUpdateData {
  amount?: number;
  dueDate?: Date;
  description?: string;
  category?: string;
  status?: string;
  metadata?: Record<string, any>;
} 