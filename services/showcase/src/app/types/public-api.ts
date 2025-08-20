import { WalletNetwork } from './goals';

export interface PublicWallet {
  id: number;
  publicKey: string;
  network: WalletNetwork;
  createdAt: string;
  lastBalance: string;
  lastBalanceUpdate: string;
  exchangeRate: number;
  balanceUSD: string;
}

export interface PublicUserProfile {
  username: string | null;
  bio: string | null;
  avatar: string | null;
}

export interface PublicUser {
  id: number;
  address: string;
  profile: PublicUserProfile | null;
}

export interface PublicEvaluation {
  achievabilityScore: number;
  summary: string;
  analysisDetails: any;
}

export interface PublicTask {
  id: number;
  title: string;
  description: string | null;
  status: 'PENDING' | 'ACTIVE' | 'COMPLETED';
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  sequence: number;
  deadline: string;
  createdAt: string;
  updatedAt: string;
}

export interface PublicGoal {
  id: string;
  title: string;
  description: string;
  deadline: string;
  status: 'PENDING' | 'FUNDED' | 'ACTIVE' | 'COMPLETED' | 'FAILED';
  category: 'EDUCATION' | 'HEALTH' | 'CAREER' | 'FINANCE' | 'PERSONAL' | 'HOBBIES' | 'RELATIONSHIPS' | 'TRAVEL' | 'OTHER';
  image: string | null;
  createdAt: string;
  updatedAt: string;
  wallets: PublicWallet[];
  user: PublicUser;
  totalUsdBalance: string;
  evaluation: PublicEvaluation | null;
  tasks?: PublicTask[]; // Only present in single goal endpoint
}

// Response types for API endpoints
export type GetPublicGoalsResponse = PublicGoal[];

export type GetPublicGoalResponse = PublicGoal; 