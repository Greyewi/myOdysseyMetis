import { WalletNetwork } from '@prisma/client';

// Token IDs for different networks in CoinGecko
const COINGECKO_IDS = {
  [WalletNetwork.ERC20]: 'ethereum',
  [WalletNetwork.ARBITRUM]: 'ethereum',
  [WalletNetwork.OPTIMISM]: 'ethereum',
  [WalletNetwork.POLYGON]: 'matic-network',
  [WalletNetwork.BSC]: 'binancecoin',
  [WalletNetwork.METIS]: 'metis-token',
  // [WalletNetwork.TRC20]: 'tron',
};

export async function getTokenPrice(network: WalletNetwork): Promise<number> {
  try {
    const coinId = COINGECKO_IDS[network];
    if (!coinId) {
      throw new Error(`No CoinGecko ID found for network ${network}`);
    }

    const apiKey = process.env.COINGECKO_API_KEY;
    const headers: HeadersInit = {};
    if (apiKey) {
      headers['x-cg-pro-api-key'] = apiKey;
    }

    const response = await fetch(
      `https://api.coingecko.com/api/v3/simple/price?ids=${coinId}&vs_currencies=usd`,
      { headers }
    );
    
    if (!response.ok) {
      throw new Error(`Failed to fetch price for ${network}: ${response.statusText}`);
    }

    const data = await response.json();
    return data[coinId].usd;
  } catch (error) {
    // console.error(`Error fetching price for ${network}:`, error);
    throw error;
  }
} 