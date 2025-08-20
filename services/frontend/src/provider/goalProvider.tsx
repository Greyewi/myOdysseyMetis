import React, { createContext, useContext } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import * as goalsApi from '../app/api/goals';
import { Goal, GoalWithWallet, GoalStatus, GoalCategory, WalletNetwork } from '@/types/goals';
import { config } from '@/config';
import { usePrices } from '@/hooks/usePrices';

interface UpdatedWallet {
  id: number;
  publicKey: string;
  network: WalletNetwork;
  balance: string;
  lastBalanceUpdate: Date;
}

interface TokenPrices {
  [network: string]: number;
}

type GoalsContextType = {
  allGoals: GoalWithWallet[] | undefined;
  myGoals: GoalWithWallet[] | undefined;
  isLoading: boolean;
  tokenPrices: TokenPrices;
  refetchAllGoals: () => void;
  refetchMyGoals: () => void;
  updateGoalStatus: (goalId: number, status: GoalStatus) => Promise<Goal>;
  updateGoal: (goalId: number, data: Partial<{
    title: string;
    description: string;
    category: GoalCategory;
  }>) => Promise<GoalWithWallet>;
  deleteGoal: (goalId: number) => Promise<void>;
  createWallet: (goalId: number, network: WalletNetwork) => Promise<GoalWithWallet>;
  getGoalById: (goalId: number) => Promise<GoalWithWallet>;
  updateWalletBalance: (walletId: number) => Promise<UpdatedWallet>;
  updateGoalRefundAddress: (goalId: number, walletId: number, refundAddress: string) => Promise<GoalWithWallet>;
  convertBalanceToUSD: (balance: string, network: WalletNetwork) => number;
  getTotalBalanceInUSD: (wallets: Array<{ lastBalance?: string; network: WalletNetwork }>) => number;
  getPublishedGoal: (id: number) => Promise<GoalWithWallet>;
  generateShareToken: (goalId: number) => Promise<{shareToken: string, shareUrl: string}>;
  revokeShareToken: (goalId: number) => Promise<void>;
  processGoalRefund: (goalId: number) => Promise<goalsApi.RefundSummary>;
  getGoalRefundStatus: (goalId: number) => Promise<goalsApi.RefundStatus>;
};

const GoalsContext = createContext<GoalsContextType | undefined>(undefined);


export const GoalsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { prices: tokenPrices, isLoading: pricesLoading } = usePrices();

  // Fetch all goals
  const allGoalsQuery = useQuery({
    queryKey: ['goals', 'all'],
    queryFn: () => goalsApi.getAllGoals()
  });
  
  // Fetch my goals
  const myGoalsQuery = useQuery({
    queryKey: ['goals', 'my'],
    queryFn: () => goalsApi.getMyGoals()
  });
  
  // Utility function to convert crypto balance to USD
  const convertBalanceToUSD = (balance: string, network: WalletNetwork): number => {
    const price = tokenPrices?.find(p => p.network === network)?.price || 0;
    const numericBalance = parseFloat(balance);
    return numericBalance * price;
  };
  
  // Utility function to get total balance in USD
  const getTotalBalanceInUSD = (wallets: Array<{ lastBalance?: string; network: WalletNetwork }>): number => {
    return wallets.reduce((total, wallet) => {
      if (!wallet.lastBalance) return total;
      return total + convertBalanceToUSD(wallet.lastBalance, wallet.network);
    }, 0);
  };

  // Mutations
  const updateGoalStatusMutation = useMutation({
    mutationFn: ({ goalId, status }: { goalId: number; status: GoalStatus }) =>
      goalsApi.updateGoalStatus(goalId, status),
  });

  const updateGoalMutation = useMutation({
    mutationFn: ({ goalId, data }: { goalId: number; data: any }) =>
      goalsApi.updateGoal(goalId, data),
  });

  const deleteGoalMutation = useMutation({
    mutationFn: (goalId: number) => goalsApi.deleteGoal(goalId),
  });

  const createWalletMutation = useMutation({
    mutationFn: ({ goalId, network }: { goalId: number; network: WalletNetwork }) =>
      goalsApi.createWallet(goalId, network),
  });

  const getGoalByIdMutation = useMutation({
    mutationFn: (goalId: number) => goalsApi.getGoalById(goalId),
  });

  const updateWalletBalanceMutation = useMutation({
    mutationFn: (walletId: number) => goalsApi.updateWalletBalance(walletId)
  });

  const updateGoalRefundAddressMutation = useMutation({
    mutationFn: ({ goalId, walletId, refundAddress }: { goalId: number; walletId: number; refundAddress: string }) => 
      goalsApi.updateGoalRefundAddress(goalId, walletId, refundAddress)
  });

  // Get a specific published goal by ID (public endpoint)
  const getPublishedGoal = async (id: number): Promise<GoalWithWallet> => {
    try {
      const response = await fetch(`${config.apiUrl}/public-goals/${id}`);
      if (!response.ok) {
        throw new Error('Failed to fetch published goal');
      }
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error fetching published goal:', error);
      throw error;
    }
  };



  // Generate share token for a goal
  const generateShareToken = async (goalId: number): Promise<{shareToken: string, shareUrl: string}> => {
    try {
      const response = await fetch(`${config.apiUrl}/goals/${goalId}/generate-share-token`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('cryptogoals_auth_token')}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to generate share token');
      }
      
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error generating share token:', error);
      throw error;
    }
  };

  // Revoke share token for a goal
  const revokeShareToken = async (goalId: number): Promise<void> => {
    try {
      const response = await fetch(`${config.apiUrl}/goals/${goalId}/share-token`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('cryptogoals_auth_token')}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to revoke share token');
      }
    } catch (error) {
      console.error('Error revoking share token:', error);
      throw error;
    }
  };

  // Convert prices array to object for backward compatibility
  const tokenPricesObject: TokenPrices = {};
  tokenPrices?.forEach(price => {
    tokenPricesObject[price.network] = price.price;
  });

  // Context value
  const value: GoalsContextType = {
    allGoals: allGoalsQuery.data as GoalWithWallet[] | undefined,
    myGoals: myGoalsQuery.data as GoalWithWallet[] | undefined,
    isLoading: allGoalsQuery.isLoading || myGoalsQuery.isLoading || pricesLoading,
    tokenPrices: tokenPricesObject,
    refetchAllGoals: () => allGoalsQuery.refetch(),
    refetchMyGoals: () => myGoalsQuery.refetch(),
    updateGoalStatus: (goalId, status) =>
      updateGoalStatusMutation.mutateAsync({ goalId, status }),
    updateGoal: (goalId, data) =>
      updateGoalMutation.mutateAsync({ goalId, data }),
    deleteGoal: (goalId) => deleteGoalMutation.mutateAsync(goalId),
    createWallet: (goalId, network) =>
      createWalletMutation.mutateAsync({ goalId, network }),
    getGoalById: (goalId) => getGoalByIdMutation.mutateAsync(goalId),
    updateWalletBalance: (walletId) => updateWalletBalanceMutation.mutateAsync(walletId),
    updateGoalRefundAddress: (goalId, walletId, refundAddress) =>
      updateGoalRefundAddressMutation.mutateAsync({ goalId, walletId, refundAddress }),
    convertBalanceToUSD,
    getTotalBalanceInUSD,
    getPublishedGoal,
    generateShareToken,
    revokeShareToken,
    processGoalRefund: (goalId) => goalsApi.processGoalRefund(goalId).then(result => result.summary),
    getGoalRefundStatus: (goalId) => goalsApi.getGoalRefundStatus(goalId).then(result => ({
      eligible: result.eligible,
      walletsWithRefundAddress: result.walletsWithRefundAddress,
      totalWallets: result.totalWallets,
      estimatedRefundAmount: result.estimatedRefundAmount,
      walletEstimates: result.walletEstimates
    })),
  };

  return (
    <GoalsContext.Provider value={value}>
      {children}
    </GoalsContext.Provider>
  );
};

export const useGoals = () => {
  const ctx = useContext(GoalsContext);
  if (!ctx) throw new Error('useGoals must be used within a GoalsProvider');
  return ctx;
};
