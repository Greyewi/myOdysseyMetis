import { Goal, GoalStatus, GoalWithWallet, GoalCategory, WalletNetwork, GoalEvaluationResult } from '../../types/goals';
import { config } from '@/config';

const API_URL = config.apiUrl;

export const getAllGoals = async (queryString: string = '') => {
  const response = await fetch(`${API_URL}/goals/all?${queryString}`);
  if (!response.ok) {
    throw new Error('Failed to fetch goals');
  }
  return response.json();
};

export const getMyGoals = async (): Promise<GoalWithWallet[]> => {
  const response = await fetch(`${API_URL}/goals`, {
    headers: {
      'Authorization': `Bearer ${localStorage.getItem('cryptogoals_auth_token')}`
    }
  });
  return response.json();
};

export const updateGoalStatus = async (goalId: number, status: GoalStatus): Promise<Goal> => {
  const response = await fetch(`${API_URL}/goals/${goalId}/status`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${localStorage.getItem('cryptogoals_auth_token')}`
    },
    body: JSON.stringify({ status })
  });
  return response.json();
};

interface UpdatedWallet {
  id: number;
  publicKey: string;
  network: WalletNetwork;
  balance: string;
  lastBalanceUpdate: Date;
}

export const updateWalletBalance = async (walletId: number): Promise<UpdatedWallet> => {
  const response = await fetch(`${API_URL}/goals/wallet/${walletId}/update-balance`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${localStorage.getItem('cryptogoals_auth_token')}`
    }
  });
  
  if (!response.ok) {
    throw new Error('Failed to update wallet balance');
  }
  
  return response.json();
};

export const getGoalById = async (goalId: number): Promise<GoalWithWallet> => {
  const response = await fetch(`${API_URL}/goals/${goalId}`, {
    headers: {
      'Authorization': `Bearer ${localStorage.getItem('cryptogoals_auth_token')}`
    }
  });
  return response.json();
};

export const updateGoal = async (goalId: number, data: {
  title?: string;
  description?: string;
  category?: GoalCategory;
}): Promise<GoalWithWallet> => {
  const response = await fetch(`${API_URL}/goals/${goalId}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${localStorage.getItem('cryptogoals_auth_token')}`
    },
    body: JSON.stringify(data)
  });
  return response.json();
};

export const deleteGoal = async (goalId: number): Promise<void> => {
  const response = await fetch(`${API_URL}/goals/${goalId}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${localStorage.getItem('cryptogoals_auth_token')}`
    }
  });
  
  if (!response.ok) {
    throw new Error('Failed to delete goal');
  }
};

export const updateGoalRefundAddress = async (goalId: number, walletId: number, refundAddress: string): Promise<GoalWithWallet> => {
  const response = await fetch(`${API_URL}/goals/${goalId}/refund-address`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${localStorage.getItem('cryptogoals_auth_token')}`
    },
    body: JSON.stringify({ refundAddress, walletId })
  });
  
  if (!response.ok) {
    throw new Error('Failed to update refund address');
  }
  
  return response.json();
};

export const createWallet = async (goalId: number, network: WalletNetwork): Promise<GoalWithWallet> => {
  const response = await fetch(`${API_URL}/goals/${goalId}/wallets`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${localStorage.getItem('cryptogoals_auth_token')}`
    },
    body: JSON.stringify({ network })
  });
  
  if (!response.ok) {
    throw new Error('Failed to create wallet');
  }
  
  return response.json();
};

export const evaluateGoal = async (goalId: number): Promise<GoalEvaluationResult> => {
  const response = await fetch(`${API_URL}/goals/${goalId}/evaluate`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${localStorage.getItem('cryptogoals_auth_token')}`
    }
  });
  
  if (!response.ok) {
    throw new Error('Failed to evaluate goal');
  }
  
  return response.json();
};

export const reevaluateGoal = async (goalId: number): Promise<GoalEvaluationResult> => {
  const response = await fetch(`${API_URL}/goals/${goalId}/reevaluate`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${localStorage.getItem('cryptogoals_auth_token')}`
    }
  });
  
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || 'Failed to reevaluate goal');
  }
  
  return response.json();
};



// Generate share token for a goal
export const generateShareToken = async (goalId: number): Promise<{shareToken: string, shareUrl: string}> => {
  const response = await fetch(`${API_URL}/goals/${goalId}/generate-share-token`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${localStorage.getItem('cryptogoals_auth_token')}`
    }
  });
  
  if (!response.ok) {
    throw new Error('Failed to generate share token');
  }
  
  return response.json();
};

// Revoke share token for a goal
export const revokeShareToken = async (goalId: number): Promise<void> => {
  const response = await fetch(`${API_URL}/goals/${goalId}/share-token`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${localStorage.getItem('cryptogoals_auth_token')}`
    }
  });
  
  if (!response.ok) {
    throw new Error('Failed to revoke share token');
  }
};

// Refund types
export interface RefundResult {
  walletId: number;
  success: boolean;
  txHash?: string;
  error?: string;
  refundAddress?: string;
  amount?: string;
  network: WalletNetwork;
}

export interface RefundSummary {
  totalRefunds: number;
  successfulRefunds: number;
  failedRefunds: number;
  results: RefundResult[];
  completedAt: Date;
}

export interface WalletEstimate {
  walletId: number;
  network: WalletNetwork;
  currentBalance: string;
  gasFee: string;
  maxSendableAmount: string;
  hasInsufficientBalance: boolean;
  errorMessage?: string;
}

export interface RefundStatus {
  eligible: boolean;
  walletsWithRefundAddress: number;
  totalWallets: number;
  estimatedRefundAmount: string;
  walletEstimates: WalletEstimate[];
}

// Process refund for a completed goal
export const processGoalRefund = async (goalId: number): Promise<{
  message: string;
  goalId: number;
  summary: RefundSummary;
}> => {
  const response = await fetch(`${API_URL}/goals/${goalId}/refund`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${localStorage.getItem('cryptogoals_auth_token')}`
    }
  });
  
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || 'Failed to process refund');
  }
  
  return response.json();
};

// Get refund status for a goal
export const getGoalRefundStatus = async (goalId: number): Promise<{
  goalId: number;
  goalStatus: GoalStatus;
  eligible: boolean;
  walletsWithRefundAddress: number;
  totalWallets: number;
  estimatedRefundAmount: string;
  walletEstimates: WalletEstimate[];
}> => {
  const response = await fetch(`${API_URL}/goals/${goalId}/refund-status`, {
    headers: {
      'Authorization': `Bearer ${localStorage.getItem('cryptogoals_auth_token')}`
    }
  });
  
  if (!response.ok) {
    throw new Error('Failed to get refund status');
  }
  
  return response.json();
};