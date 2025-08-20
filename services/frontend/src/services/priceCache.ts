import { WalletNetwork } from '../types/goals';
import { config } from '@/config';

const API_URL = config.apiUrl;

export interface TokenPrice {
  id: number;
  network: WalletNetwork;
  price: number;
  createdAt: string;
  updatedAt: string;
}

export async function getAllCachedPrices(): Promise<TokenPrice[]> {
  try {
    const response = await fetch(`${API_URL}/api/prices`);
    if (!response.ok) {
      throw new Error(`Failed to fetch cached prices: ${response.statusText}`);
    }
    return response.json();
  } catch (error) {
    console.error('Error fetching cached prices:', error);
    throw error;
  }
}

export async function getCachedPrice(network: WalletNetwork): Promise<TokenPrice> {
  try {
    const response = await fetch(`${API_URL}/api/prices/${network}`);
    if (!response.ok) {
      throw new Error(`Failed to fetch cached price for ${network}: ${response.statusText}`);
    }
    return response.json();
  } catch (error) {
    console.error(`Error fetching cached price for ${network}:`, error);
    throw error;
  }
} 