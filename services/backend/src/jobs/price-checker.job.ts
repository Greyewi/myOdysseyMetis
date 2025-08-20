import { PrismaClient, WalletNetwork } from '@prisma/client';
import { getTokenPrice } from '../services/price.service';
import { queueService } from '../services/queue.service';
import type { Job } from 'pg-boss';

const prisma = new PrismaClient();

export const PRICE_CHECKER_JOB = 'price-checker';
const MAX_RETRIES = 5;
const BASE_DELAY = 10000; // 5 seconds

// Skip SOLANA, BITCOIN, and TRC20 for now
const SUPPORTED_NETWORKS = [
  WalletNetwork.ERC20,
  WalletNetwork.ARBITRUM,
  WalletNetwork.OPTIMISM,
  WalletNetwork.POLYGON,
  WalletNetwork.BSC,
  WalletNetwork.METIS,
];

interface PriceCheckerJob {
  timestamp: number;
}

async function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function fetchPriceWithRetry(network: WalletNetwork): Promise<number> {
  let lastError: Error | null = null;
  
  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    try {
      const price = await getTokenPrice(network);
      return price;
    } catch (error) {
      lastError = error as Error;
      const delay = BASE_DELAY * Math.pow(2, attempt);
      console.log(`Retry ${attempt + 1}/${MAX_RETRIES} for ${network} after ${delay}ms`);
      await sleep(delay);
    }
  }
  
  throw lastError;
}

export async function registerPriceCheckerJob() {
  // Create the queue first
  await queueService.createQueue(PRICE_CHECKER_JOB);

  // Register the job handler
  await queueService.processJobs(PRICE_CHECKER_JOB, async (job: Job<PriceCheckerJob>) => {
    // Use only supported networks
    for (const network of SUPPORTED_NETWORKS) {
      try {
        const price = await fetchPriceWithRetry(network);
        
        await prisma.tokenPrice.upsert({
          where: { network },
          update: { price },
          create: {
            network,
            price,
          },
        });
        
        console.log(`Updated price for ${network}: ${price}`);
      } catch (error) {
        console.error(`Failed to update price for ${network} after ${MAX_RETRIES} retries:`, error);
      }
    }

    // Schedule the next run
    const nextJobData: PriceCheckerJob = {
      timestamp: Date.now()
    };
    
    await queueService.sendJob(PRICE_CHECKER_JOB, nextJobData, {
      startAfter: 10 * 60 // 10 minutes in seconds
    });
  });

  // Start the first job
  const initialJobData: PriceCheckerJob = {
    timestamp: Date.now()
  };
  
  await queueService.sendJob(PRICE_CHECKER_JOB, initialJobData);
} 