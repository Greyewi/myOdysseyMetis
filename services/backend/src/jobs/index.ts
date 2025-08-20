import { initializeBalanceChecker } from './balance-checker.job';
import { registerPriceCheckerJob } from './price-checker.job';

export async function initializeJobs() {
  try {
    // Start the balance checker processor
    initializeBalanceChecker();
    console.log('Balance checker initialized successfully');

    // Register and start the price checker job
    await registerPriceCheckerJob();
    console.log('Price checker initialized successfully');
  } catch (error) {
    console.error('Error initializing jobs:', error);
    throw error;
  }
} 