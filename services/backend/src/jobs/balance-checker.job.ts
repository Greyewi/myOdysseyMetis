import { queueService } from '../services/queue.service';
import { prisma } from '../prisma';
import { getWalletBalance } from '../services/blockchain';
import { socketService } from '../services/socket.service';
import type { Job } from 'pg-boss';

interface WalletMonitoringJob {
  walletId: number;
  goalId: number;
  startTime: number;
}

const MONITORING_DURATION = 30 * 60 * 1000; // 30 minutes in milliseconds
const CHECK_INTERVAL = 30 * 1000; // 30 seconds in milliseconds

export async function startWalletMonitoring(walletId: number, goalId: number) {
  try {
    // Check if there's an existing monitoring job
    const activeJobs = await queueService.getActiveJobs('monitor-wallet');
    const existingJob = activeJobs.find(job => {
      const data = job.data as WalletMonitoringJob;
      return data.walletId === walletId && data.goalId === goalId;
    });

    if (existingJob) {
      // Complete the existing job
      await queueService.completeJob(existingJob.id);
    }

    // Create a new monitoring job
    const jobData: WalletMonitoringJob = {
      walletId,
      goalId,
      startTime: Date.now()
    };

    const jobId = await queueService.sendJob('monitor-wallet', jobData);
    console.log(`[${new Date().toISOString()}] Created new monitoring job ${jobId} for wallet ${walletId}`);

    return {
      message: 'Monitoring started',
      duration: MONITORING_DURATION,
      interval: CHECK_INTERVAL,
      walletId,
      goalId
    };
  } catch (error) {
    console.error('Error in startWalletMonitoring:', error);
    throw error;
  }
}

export async function processBalanceChecks(job: Job<WalletMonitoringJob>) {
  const { walletId, goalId, startTime } = job.data;
  const elapsedTime = Date.now() - startTime;

  // Check if monitoring period has expired
  if (elapsedTime > MONITORING_DURATION) {
    console.log(`[${new Date().toISOString()}] Monitoring completed for wallet ${walletId}`);
    return;
  }

  try {
    // Get the wallet
    const wallet = await prisma.wallet.findUnique({
      where: { id: walletId }
    });

    if (!wallet) {
      console.error(`[${new Date().toISOString()}] Wallet ${walletId} not found`);
      return;
    }

    // Get the current balance
    const balance = await getWalletBalance(wallet.publicKey, wallet.network);

    // Get the previous balance
    const previousBalance = wallet.lastBalance || '0';
    const hasBalanceChanged = balance !== previousBalance;

    // Update the wallet's last balance
    await prisma.wallet.update({
      where: { id: walletId },
      data: { 
        lastBalance: balance,
        lastBalanceUpdate: new Date()
      }
    });

    // Notify about balance change if it has changed
    if (hasBalanceChanged) {
      socketService.notifyBalanceChange(walletId, balance);
    }

    // Schedule the next check if we're still within the monitoring period
    if (MONITORING_DURATION - elapsedTime > CHECK_INTERVAL) {
      const nextJobData: WalletMonitoringJob = {
        walletId,
        goalId,
        startTime
      };
      
      const delayInSeconds = Math.floor(CHECK_INTERVAL / 1000);
      await queueService.sendJob('monitor-wallet', nextJobData, {
        startAfter: delayInSeconds
      });
    }
  } catch (error) {
    console.error(`[${new Date().toISOString()}] Error processing balance check for wallet ${walletId}:`, error);
  }
}

// Initialize the job processor
export function initializeBalanceChecker() {
  queueService.processJobs('monitor-wallet', async (job: Job<WalletMonitoringJob>) => {
    try {
      await processBalanceChecks(job);
    } catch (error) {
      console.error('Error processing balance check:', error);
    }
  }).catch(error => {
    console.error('Error starting job processor:', error);
  });
} 