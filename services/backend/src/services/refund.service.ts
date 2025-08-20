import { Goal, Wallet, WalletNetwork } from '@prisma/client';
import { prisma } from '../prisma';
import { sendTransaction, sendMaximumAmount, getWalletBalance, TransactionResult, estimateGasFee, GasEstimate } from './blockchain';
import { socketService } from './socket.service';

export interface RefundResult {
  walletId: number;
  success: boolean;
  txHash?: string;
  error?: string;
  refundAddress?: string;
  amount?: string;
  network: WalletNetwork;
}

export interface GoalRefundSummary {
  goalId: number;
  totalRefunds: number;
  successfulRefunds: number;
  failedRefunds: number;
  results: RefundResult[];
  completedAt: Date;
}

export class RefundService {
  
  /**
   * Process refunds for all wallets associated with a completed goal
   */
  async processGoalRefunds(goalId: number): Promise<GoalRefundSummary> {
    console.log(`[RefundService] Starting refund process for goal ${goalId}`);
    
    try {
      // Get the goal and its wallets
      const goal = await prisma.goal.findUnique({
        where: { id: goalId },
        include: {
          wallets: {
            where: {
              refundAddress: { not: null }
            }
          }
        }
      });

      if (!goal) {
        throw new Error(`Goal with ID ${goalId} not found`);
      }

      if (!goal.wallets || goal.wallets.length === 0) {
        console.log(`[RefundService] No wallets with refund addresses found for goal ${goalId}`);
        return {
          goalId,
          totalRefunds: 0,
          successfulRefunds: 0,
          failedRefunds: 0,
          results: [],
          completedAt: new Date()
        };
      }

      console.log(`[RefundService] Found ${goal.wallets.length} wallets with refund addresses for goal ${goalId}`);

      // Process refunds for each wallet
      const refundPromises = goal.wallets.map(wallet => 
        this.processWalletRefund(wallet)
      );

      const results = await Promise.all(refundPromises);

      // Calculate summary
      const successfulRefunds = results.filter(r => r.success).length;
      const failedRefunds = results.filter(r => !r.success).length;

      const summary: GoalRefundSummary = {
        goalId,
        totalRefunds: results.length,
        successfulRefunds,
        failedRefunds,
        results,
        completedAt: new Date()
      };

      console.log(`[RefundService] Goal ${goalId} refund process completed:`, {
        total: results.length,
        successful: successfulRefunds,
        failed: failedRefunds
      });

      // Log refund summary to database
      await this.logRefundSummary(summary);

      return summary;

    } catch (error) {
      console.error(`[RefundService] Error processing refunds for goal ${goalId}:`, error);
      throw error;
    }
  }

  /**
   * Process refund for a single wallet
   */
  private async processWalletRefund(wallet: Wallet): Promise<RefundResult> {
    console.log(`[RefundService] Processing refund for wallet ${wallet.id} (${wallet.network})`);
    
    try {
      // Check if wallet has a refund address
      if (!wallet.refundAddress) {
        return {
          walletId: wallet.id,
          success: false,
          error: 'No refund address set',
          network: wallet.network
        };
      }

      // Get current wallet balance from blockchain (real-time)
      const currentBalance = await getWalletBalance(wallet.publicKey, wallet.network);
      const balanceNumber = parseFloat(currentBalance);

      console.log(`[RefundService] Wallet ${wallet.id} balance: ${currentBalance} ${wallet.network}`);

      if (balanceNumber <= 0) {
        console.log(`[RefundService] Wallet ${wallet.id} has zero balance, skipping refund`);
        return {
          walletId: wallet.id,
          success: false,
          error: 'Wallet balance is zero or negative',
          refundAddress: wallet.refundAddress,
          amount: '0',
          network: wallet.network
        };
      }

      // Additional safety check - ensure balance is meaningful (greater than dust amount)
      const dustThreshold = 0.001; // Minimum balance worth refunding
      if (balanceNumber < dustThreshold) {
        console.log(`[RefundService] Wallet ${wallet.id} balance too small (${currentBalance}), skipping refund`);
        return {
          walletId: wallet.id,
          success: false,
          error: `Balance too small to refund (${currentBalance})`,
          refundAddress: wallet.refundAddress,
          amount: currentBalance,
          network: wallet.network
        };
      }

      console.log(`[RefundService] Proceeding with refund for wallet ${wallet.id}: ${currentBalance} ${wallet.network}`);

      // Send the maximum possible amount (balance - gas fees)
      const txResult = await sendMaximumAmount(
        wallet.privateKey,
        wallet.refundAddress,
        wallet.network
      );

      if (txResult.success) {
        console.log(`[RefundService] Refund successful for wallet ${wallet.id}:`, txResult.txHash);
        
        // Update wallet balance to reflect the refund
        await prisma.wallet.update({
          where: { id: wallet.id },
          data: {
            lastBalance: '0',
            lastBalanceUpdate: new Date()
          }
        });

        // Notify via socket
        socketService.notifyBalanceChange(wallet.id, '0');

        return {
          walletId: wallet.id,
          success: true,
          txHash: txResult.txHash,
          refundAddress: wallet.refundAddress,
          amount: txResult.actualAmount || currentBalance,
          network: wallet.network
        };
      } else {
        console.error(`[RefundService] Refund failed for wallet ${wallet.id}:`, txResult.error);
        
        return {
          walletId: wallet.id,
          success: false,
          error: txResult.error || 'Transaction failed',
          refundAddress: wallet.refundAddress,
          amount: currentBalance,
          network: wallet.network
        };
      }

    } catch (error) {
      console.error(`[RefundService] Error processing refund for wallet ${wallet.id}:`, error);
      
      return {
        walletId: wallet.id,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        refundAddress: wallet.refundAddress || undefined,
        network: wallet.network
      };
    }
  }

  /**
   * Log refund summary to database for auditing
   */
  private async logRefundSummary(summary: GoalRefundSummary): Promise<void> {
    try {
      // You can create a refund log table if needed, for now we'll just log to console
      console.log(`[RefundService] Refund summary for goal ${summary.goalId}:`, {
        totalRefunds: summary.totalRefunds,
        successfulRefunds: summary.successfulRefunds,
        failedRefunds: summary.failedRefunds,
        completedAt: summary.completedAt
      });

      // Update goal to mark refund as processed
      await prisma.goal.update({
        where: { id: summary.goalId },
        data: {
          // You could add a refundProcessedAt field to the Goal model if needed
          updatedAt: new Date()
        }
      });

    } catch (error) {
      console.error(`[RefundService] Error logging refund summary:`, error);
    }
  }

  /**
   * Check if a goal is eligible for refund
   */
  async isGoalEligibleForRefund(goalId: number): Promise<boolean> {
    try {
      const goal = await prisma.goal.findUnique({
        where: { id: goalId },
        include: {
          wallets: {
            where: {
              refundAddress: { not: null }
            }
          }
        }
      });

      if (!goal) {
        return false;
      }

      // Goal must be completed and have wallets with refund addresses
      return goal.status === 'COMPLETED' && 
             goal.wallets && 
             goal.wallets.length > 0;
    } catch (error) {
      console.error(`[RefundService] Error checking refund eligibility:`, error);
      return false;
    }
  }

  /**
   * Get refund status for a goal
   */
  async getRefundStatus(goalId: number): Promise<{
    eligible: boolean;
    walletsWithRefundAddress: number;
    totalWallets: number;
    estimatedRefundAmount: string;
    walletEstimates: Array<{
      walletId: number;
      network: WalletNetwork;
      currentBalance: string;
      gasFee: string;
      maxSendableAmount: string;
      hasInsufficientBalance: boolean;
      errorMessage?: string;
    }>;
  }> {
    try {
      const goal = await prisma.goal.findUnique({
        where: { id: goalId },
        include: {
          wallets: true
        }
      });

      if (!goal) {
        throw new Error(`Goal with ID ${goalId} not found`);
      }

      const walletsWithRefundAddress = goal.wallets.filter(w => w.refundAddress).length;
      const totalWallets = goal.wallets.length;
      
      // Get detailed estimates for each wallet with refund address
      const walletEstimates = [];
      let totalMaxSendable = 0;

      for (const wallet of goal.wallets.filter(w => w.refundAddress)) {
        try {
          // Get current balance
          const currentBalance = await getWalletBalance(wallet.publicKey, wallet.network);
          
          // Estimate gas fees
          const gasEstimate = await estimateGasFee(
            wallet.publicKey,
            wallet.refundAddress!,
            wallet.network
          );

          walletEstimates.push({
            walletId: wallet.id,
            network: wallet.network,
            currentBalance,
            gasFee: gasEstimate.gasFee,
            maxSendableAmount: gasEstimate.maxSendableAmount,
            hasInsufficientBalance: gasEstimate.hasInsufficientBalance,
            errorMessage: gasEstimate.errorMessage
          });

          // Add to total if sendable
          if (!gasEstimate.hasInsufficientBalance) {
            totalMaxSendable += parseFloat(gasEstimate.maxSendableAmount);
          }
        } catch (error) {
          console.error(`[RefundService] Error estimating for wallet ${wallet.id}:`, error);
          walletEstimates.push({
            walletId: wallet.id,
            network: wallet.network,
            currentBalance: '0',
            gasFee: '0',
            maxSendableAmount: '0',
            hasInsufficientBalance: true,
            errorMessage: error instanceof Error ? error.message : 'Unknown error'
          });
        }
      }

      return {
        eligible: goal.status === 'COMPLETED' && walletsWithRefundAddress > 0,
        walletsWithRefundAddress,
        totalWallets,
        estimatedRefundAmount: totalMaxSendable.toString(),
        walletEstimates
      };

    } catch (error) {
      console.error(`[RefundService] Error getting refund status:`, error);
      throw error;
    }
  }
}

export const refundService = new RefundService(); 