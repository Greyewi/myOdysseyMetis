import express, { Router, Request, Response, NextFunction } from 'express';
import Joi from 'joi';
import { GoalStatus, WalletNetwork } from '@prisma/client';
import { authMiddleware } from '../middlewares/auth';
import { prisma } from '../prisma';
import { getWalletBalance } from '../services/blockchain';
import { generateWallet } from '../services/wallet';
import { startWalletMonitoring } from '../jobs/balance-checker.job';

const router: Router = express.Router();

interface AuthenticatedRequest extends Request {
  user?: { id: number, address: string };
}

// Validation schemas
const updateRefundAddressSchema = Joi.object({
  refundAddress: Joi.string().trim().required(),
  walletId: Joi.number().required()
});

const createWalletSchema = Joi.object({
  network: Joi.string().valid(...Object.values(WalletNetwork)).required()
});

// Helper function to update goal status based on wallet balance
const updateGoalStatus = async (goal: any) => {
  let newStatus = goal.status;

  // For MEDIUM+ difficulties, don't automatically update to FUNDED based on backend wallet balances
  if (goal.difficulty === 'MEDIUM' || goal.difficulty === 'HARD' || goal.difficulty === 'HARDCORE') {
    return newStatus;
  }

  // For EASY difficulty, use backend wallet balance logic
  if (
    goal.status === GoalStatus.PENDING && 
    goal.wallets?.some((wallet: any) => 
      wallet.lastBalance && 
      wallet.lastBalance !== '0' &&
      parseFloat(wallet.lastBalance) > 0
    )
  ) {
    return GoalStatus.FUNDED;
  }

  return newStatus;
};

// Update wallet balance
router.post('/:id/update-balance', authMiddleware, async (req: AuthenticatedRequest, res, next) => {
  try {
    const walletId = parseInt(req.params.id, 10);
    const userId = req.user?.id;

    if (!userId) {
      res.status(401).json({ message: 'Unauthorized' });
      return
    }

    // Get wallet and associated goal
    const [wallet, goal] = await Promise.all([
      prisma.wallet.findFirst({
        where: {
          id: walletId,
          userId: userId
        }
      }),
      prisma.goal.findFirst({
        where: {
          wallets: {
            some: {
              id: walletId
            }
          },
          userId: userId
        },
        include: {
          wallets: true
        }
      })
    ]);

    if (!wallet || !goal) {
      res.status(404).json({ message: 'Wallet or goal not found' });
      return
    }

    // Fetch real-time balance
    const balance = await getWalletBalance(wallet.publicKey, wallet.network);

    // Update wallet balance
    const updatedWallet = await prisma.wallet.update({
      where: { id: walletId },
      data: {
        lastBalance: balance,
        lastBalanceUpdate: new Date()
      }
    });

    // Only update goal status if there is actually money
    if (parseFloat(balance) > 0) {
      const walletWithNewBalance = {
        ...wallet,
        lastBalance: balance
      };
      
      const newStatus = await updateGoalStatus({ ...goal, wallets: [walletWithNewBalance] });
      if (newStatus !== goal.status) {
        await prisma.goal.update({
          where: { id: goal.id },
          data: { status: newStatus }
        });
      }
    }

    res.status(200).json({
      id: updatedWallet.id,
      publicKey: updatedWallet.publicKey,
      network: updatedWallet.network,
      balance: balance,
      lastBalanceUpdate: updatedWallet.lastBalanceUpdate
    });
    return
  } catch (err) {
    next(err);
  }
});

// Update refund address for a specific wallet
router.patch('/:goalId/refund-address', authMiddleware, async (req: AuthenticatedRequest, res, next) => {
  try {
    const goalId = parseInt(req.params.goalId, 10);
    const userId = req.user?.id;
    const { refundAddress, walletId } = await updateRefundAddressSchema.validateAsync(req.body);

    if (!userId) {
      res.status(401).json({ message: 'Unauthorized' });
      return
    }

    if (isNaN(goalId)) {
      res.status(400).json({ message: 'Invalid goal ID' });
      return
    }

    // Get existing goal with wallet
    const existingGoal = await prisma.goal.findFirst({
      where: {
        id: goalId,
        userId: userId
      },
      include: {
        wallets: true
      }
    });

    if (!existingGoal) {
      res.status(404).json({ message: 'Goal not found' });
      return
    }

    // Check if the specified wallet exists and belongs to this goal
    const wallet = existingGoal.wallets.find(w => w.id === walletId);
    if (!wallet) {
      res.status(404).json({ message: 'Wallet not found for this goal' });
      return
    }

    // Check if goal can be edited
    const nonEditableStatuses: GoalStatus[] = [GoalStatus.FAILED];
    if (nonEditableStatuses.includes(existingGoal.status)) {
      res.status(400).json({ 
        message: 'Cannot update refund address for goals with FAILED status' 
      });
      return
    }

    // Update only the specified wallet's refund address
    const updatedWallet = await prisma.wallet.update({
      where: {
        id: walletId
      },
      data: { refundAddress }
    });

    res.status(200).json({
      wallet: {
        id: updatedWallet.id,
        refundAddress: updatedWallet.refundAddress
      }
    });
    return
  } catch (err) {
    next(err);
  }
});

// Create additional wallet for a goal
router.post('/:goalId/create', authMiddleware, async (req: AuthenticatedRequest, res, next) => {
  try {
    const goalId = parseInt(req.params.goalId, 10);
    const userId = req.user?.id;
    const { network } = await createWalletSchema.validateAsync(req.body);

    if (!userId) {
      res.status(401).json({ message: 'Unauthorized' });
      return
    }

    if (isNaN(goalId)) {
      res.status(400).json({ message: 'Invalid goal ID' });
      return
    }

    // Get existing goal with all wallets
    const existingGoal = await prisma.goal.findFirst({
      where: {
        id: goalId,
        userId: userId
      },
      include: {
        wallets: true
      }
    });

    if (!existingGoal) {
      res.status(404).json({ message: 'Goal not found' });
      return
    }

    // Check if goal already has a wallet of this network
    if (existingGoal.wallets.some(wallet => wallet.network === network)) {
      res.status(400).json({ 
        message: `Goal already has a wallet for ${network} network` 
      });
      return
    }

    // Generate wallet using the wallet service
    const { privateKey, publicKey } = generateWallet(network as WalletNetwork);

    // Create wallet in a transaction
    const [newWallet] = await prisma.$transaction([
      prisma.wallet.create({
        data: {
          privateKey,
          publicKey,
          network: network as WalletNetwork,
          userId,
          goalId
        }
      })
    ]);

    res.status(201).json({
      id: newWallet.id,
      publicKey: newWallet.publicKey,
      network: newWallet.network
    });
    return
  } catch (err) {
    next(err);
  }
});

// Check wallet monitoring status and start monitoring
router.get('/:id/monitoring-status', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const walletId = parseInt(req.params.id, 10);

    if (isNaN(walletId)) {
      res.status(400).json({ message: 'Invalid wallet ID' });
      return
    }

    // Get wallet and associated goal
    const [wallet, goal] = await Promise.all([
      prisma.wallet.findFirst({
        where: {
          id: walletId
        }
      }),
      prisma.goal.findFirst({
        where: {
          wallets: {
            some: {
              id: walletId
            }
          },
          status: GoalStatus.ACTIVE // Only allow monitoring for active (published) goals
        }
      })
    ]);

    if (!wallet || !goal) {
      res.status(404).json({ message: 'Wallet or goal not found' });
      return
    }

    // Start or reset monitoring
    await startWalletMonitoring(wallet.id, goal.id);

    res.status(200).json({
      message: 'Wallet monitoring started/reset',
      duration: '30 minutes',
      interval: '30 seconds',
      walletId: wallet.id,
      goalId: goal.id
    });
    return
  } catch (err) {
    next(err);
  }
});

export default router; 