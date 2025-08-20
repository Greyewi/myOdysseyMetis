export type WalletNetwork = 'TRC20' | 'ERC20' | 'ARBITRUM' | 'OPTIMISM' | 'POLYGON' | 'BSC' | 'SOLANA' | 'BITCOIN';

export interface Wallet {
  id: number;
  address: string;
  network: WalletNetwork;
  balance: number;
}

export type GoalCategory = 'EDUCATION' | 'HEALTH' | 'CAREER' | 'FINANCE' | 'PERSONAL' | 'HOBBIES' | 'RELATIONSHIPS' | 'TRAVEL' | 'OTHER';

export type GoalStatus = 'PENDING' | 'FUNDED' | 'ACTIVE' | 'COMPLETED' | 'FAILED';

export interface User {
  id: number;
  name?: string;
  address: string;
  avatar?: string;
  bio?: string;
}

export interface GoalWithWallet {
  id: number;
  title: string;
  description: string;
  image: string | null;
  deadline: string;
  category: GoalCategory;
  status: GoalStatus;
  user: User;
  wallets: Wallet[];
  createdAt: string;
  updatedAt: string;
  totalUsdBalance: string;
} 