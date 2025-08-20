export enum GoalStatus {
  PENDING = 'PENDING',
  FUNDED = 'FUNDED',
  ACTIVE = 'ACTIVE',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED'
}

export enum GoalCategory {
  EDUCATION = 'EDUCATION',
  HEALTH = 'HEALTH',
  CAREER = 'CAREER',
  FINANCE = 'FINANCE',
  PERSONAL = 'PERSONAL',
  HOBBIES = 'HOBBIES',
  RELATIONSHIPS = 'RELATIONSHIPS',
  TRAVEL = 'TRAVEL',
  OTHER = 'OTHER'
}

export enum WalletNetwork {
  ERC20 = 'ERC20',
  ARBITRUM = 'ARBITRUM',
  OPTIMISM = 'OPTIMISM',
  POLYGON = 'POLYGON',
  BSC = 'BSC',
  SOLANA = 'SOLANA',
  BITCOIN = 'BITCOIN',
  TRC20 = 'TRC20',
  METIS = 'METIS'
}

export interface Wallet {
  id: number;
  publicKey: string;
  network: WalletNetwork;
  lastBalance?: string;
  lastBalanceUpdate?: Date | null;
  userId: number;
  address: string;
  refundAddress?: string | null;
  createdAt?: string | Date;
}

export interface UserProfile {
  username?: string;
  bio?: string;
  avatar?: string;
}

export enum GoalDifficulty {
  EASY = 'EASY',
  MEDIUM = 'MEDIUM',
  HARD = 'HARD',
  HARDCORE = 'HARDCORE',
  UNSET = 'UNSET'
}

export interface Goal {
  id: number;
  title: string;
  description: string;
  status: GoalStatus;
  category: GoalCategory;
  deadline: Date;
  userId: number;
  walletId?: number;
  wallet?: Wallet;
  deposit?: string;
  image?: string;
  weeklyTimeCommitment?: number;
  currentExperience?: string;
  availableResources?: string;
  startingPoint?: string;
  difficulty?: GoalDifficulty;
}

export type GoalWithWallet = Goal & {
  wallets: Wallet[];
  user?: {
    id: number;
    address: string;
    profile?: UserProfile;
  };
  evaluation?: GoalEvaluationResult;
};

export enum TaskStatus {
  PENDING = 'PENDING',
  ACTIVE = 'ACTIVE',
  COMPLETED = 'COMPLETED'
}

export enum TaskPriority {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  URGENT = 'URGENT'
}

export interface Task {
  id: number;
  goalId: number;
  title: string;
  description: string | null;
  deadline: string;
  status: TaskStatus;
  priority: TaskPriority;
  sequence: number;
  createdAt: string;
  updatedAt: string;
}

export interface GoalEvaluationResult {
  achievabilityScore: number;
  summary: string;
  analysisDetails: any;
}

export interface SuggestedTask {
  title: string;
  description?: string;
  deadlineOffsetDays: number;
  priority?: TaskPriority;
  sequence: number;
} 