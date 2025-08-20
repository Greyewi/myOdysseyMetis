import { API_URL } from '../config';
import { WalletNetwork } from '../types/goals';
import { PublicGoal } from '../types/public-api';

// Helper function to calculate total USD balance for a goal
const calculateTotalUsdBalance = (wallets: any[]): string => {
  const totalBalance = wallets.reduce((total, wallet) => {
    const balance = parseFloat(wallet.lastBalance || '0');
    const exchangeRate = wallet.exchangeRate || 0;
    return total + (balance * exchangeRate);
  }, 0);
  return totalBalance.toFixed(2);
};

// Helper function to transform goal data
const transformGoalData = (data: any): PublicGoal => {
  const wallets = data.wallets?.map((wallet: any) => {
    const balance = parseFloat(wallet.lastBalance || '0');
    const exchangeRate = wallet.exchangeRate || 0;
    return {
      ...wallet,
      lastBalance: wallet.lastBalance || '0',
      exchangeRate: wallet.exchangeRate || 0,
      balanceUSD: (balance * exchangeRate).toFixed(2)
    };
  }) || [];

  // Format image URL correctly - images are served from root domain, not API endpoint
  const imageUrl = data.image ? 
    `${API_URL.replace('/api', '')}/uploads/${data.image.replace(/^uploads\//, '')}` : 
    null;

  return {
    ...data,
    id: data.id.toString(),
    image: imageUrl,
    wallets,
    totalUsdBalance: calculateTotalUsdBalance(wallets),
    evaluation: data.evaluation || null,
    tasks: data.tasks || undefined // Only present in single goal endpoint
  };
};

// Server-side fetch function
export async function fetchGoals(): Promise<PublicGoal[]> {
  try {
    
    const response = await fetch(`${API_URL}/public-goals/all`, {
      cache: 'no-store', // Disable caching to always get fresh data
      headers: {
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('API Error:', {
        status: response.status,
        statusText: response.statusText,
        body: errorText
      });
      throw new Error(`Failed to fetch goals: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    
    const transformedData = Array.isArray(data) ? data.map(transformGoalData) : [transformGoalData(data)];
    
    return transformedData;
  } catch (error) {
    console.error('Fetch error:', error);
    throw error;
  }
}

// Client-side function to filter and paginate goals
export function filterAndPaginateGoals(
  goals: PublicGoal[],
  {
    page = 1,
    sort = 'deadline_desc',
    category = '',
    network = '',
    itemsPerPage = 10
  }: {
    page?: number;
    sort?: 'deadline_asc' | 'deadline_desc';
    category?: string;
    network?: string;
    itemsPerPage?: number;
  }
): { goals: PublicGoal[]; totalPages: number } {
  // Filter goals
  let filteredGoals = goals.filter(goal => {
    const matchesCategory = !category || goal.category === category;
    const matchesNetwork = !network || goal.wallets.some(wallet => wallet.network === network);
    return matchesCategory && matchesNetwork;
  });

  // Sort goals
  filteredGoals.sort((a, b) => {
    const dateA = new Date(a.deadline).getTime();
    const dateB = new Date(b.deadline).getTime();
    return sort === 'deadline_asc' ? dateA - dateB : dateB - dateA;
  });

  // Calculate pagination
  const totalPages = Math.ceil(filteredGoals.length / itemsPerPage);
  const startIndex = (page - 1) * itemsPerPage;
  const paginatedGoals = filteredGoals.slice(startIndex, startIndex + itemsPerPage);

  return {
    goals: paginatedGoals,
    totalPages
  };
}

// Server-side fetch function for single goal
export const fetchGoalById = async (goalId: string): Promise<PublicGoal> => {
  const response = await fetch(`${API_URL}/public-goals/${goalId}`, {
    cache: 'no-store', // Disable caching to always get fresh data
    headers: {
      'Accept': 'application/json',
    },
  });
  
  if (!response.ok) {
    console.error('Failed to fetch goal:', response.status, response.statusText);
    throw new Error('Failed to fetch goal');
  }
  
  const data = await response.json();
  
  // Transform the data to ensure proper image URLs
  return transformGoalData(data);
};

// Server-side fetch function for shared goal by token
export const fetchSharedGoal = async (shareToken: string): Promise<PublicGoal> => {
  const response = await fetch(`${API_URL}/goals/shared/${shareToken}`, {
    cache: 'no-store', // Disable caching to always get fresh data
    headers: {
      'Accept': 'application/json',
    },
  });
  
  if (!response.ok) {
    console.error('Failed to fetch shared goal:', response.status, response.statusText);
    throw new Error('Failed to fetch shared goal');
  }
  
  const data = await response.json();
  
  // Transform the data to ensure proper image URLs
  return transformGoalData(data);
};

// Helper function to convert balance to USD
export const convertBalanceToUSD = (balance: string, network: WalletNetwork): number => {
  // Mock conversion rates
  const rates: { [key in WalletNetwork]: number } = {
    TRC20: 0.1,
    ERC20: 2000,
    ARBITRUM: 2000,
    OPTIMISM: 2000,
    POLYGON: 0.8,
    BSC: 300,
    SOLANA: 150,
    BITCOIN: 45000
  };
  return parseFloat(balance) * (rates[network] || 1);
};

// Helper function to get total balance in USD for multiple wallets
export const getTotalBalanceInUSD = (wallets: { network: WalletNetwork; balance: number }[]): number => {
  return wallets.reduce((total, wallet) => {
    return total + convertBalanceToUSD(wallet.balance.toString(), wallet.network);
  }, 0);
}; 