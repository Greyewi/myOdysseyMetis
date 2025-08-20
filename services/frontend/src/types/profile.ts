export interface Wallet {
  id: number;
  address: string;
  walletType: string;
  createdAt: string;
}

export interface Profile {
  id: number;
  username: string;
  email: string;
  bio: string;
  avatar: string;
  wallets: Wallet[];
} 