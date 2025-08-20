import { Request } from 'express';

// Common interface for authenticated requests
export interface AuthenticatedRequest extends Request {
  user?: { id: number, address: string };
  file?: Express.Multer.File;
}

// Common response types
export interface APIResponse<T = any> {
  message?: string;
  data?: T;
  error?: string;
}

export interface PaginatedResponse<T> extends APIResponse<T[]> {
  totalCount: number;
  page: number;
  pageSize: number;
  hasNext: boolean;
}

// Goal-related types
export interface GoalFilters {
  category?: string;
  network?: string;
  userAddress?: string;
  status?: string;
}

export interface GoalSorting {
  field: 'balance' | 'deadline' | 'createdAt';
  direction: 'asc' | 'desc';
}

// AI-related types
export interface AIEvaluationResponse {
  achievabilityScore: number;
  summary: string;
  analysisDetails: Record<string, any>;
}

export interface AIValidationResponse {
  canMarkComplete: boolean;
  reason: string;
  suggestions?: string[];
  confidence?: 'low' | 'medium' | 'high';
}

// Blockchain-related types
export interface BlockchainResponse {
  success: boolean;
  txHash?: string;
  error?: string;
}

// Refund-related types
export interface RefundSummary {
  totalRefunds: number;
  successfulRefunds: number;
  failedRefunds: number;
  results: RefundResult[];
  completedAt: Date;
}

export interface RefundResult {
  walletId: number;
  success: boolean;
  txHash?: string;
  error?: string;
  amount?: string;
}

// Wallet-related types
export interface WalletInfo {
  id: number;
  publicKey: string;
  network: string;
  balance?: string;
  lastBalanceUpdate?: Date;
  refundAddress?: string;
  exchangeRate?: number;
} 