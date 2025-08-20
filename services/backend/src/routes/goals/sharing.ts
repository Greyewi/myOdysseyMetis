import express, { Router } from 'express';
import { authMiddleware } from '../middlewares/auth';
import { prisma } from '../prisma';
import crypto from 'crypto';

const router: Router = express.Router();

interface AuthenticatedRequest extends Request {
  user?: { id: number, address: string };
}

// Function to generate a unique share token
const generateShareToken = (): string => {
  return crypto.randomBytes(16).toString('hex');
};

// Generate share token for a goal
router.post('/:id/generate-share-token', authMiddleware, async (req: AuthenticatedRequest, res, next) => {
  try {
    const goalId = parseInt(req.params.id, 10);
    const userId = req.user?.id;

    if (!userId) {
      res.status(401).json({ message: 'Unauthorized' });
      return
    }

    if (isNaN(goalId)) {
      res.status(400).json({ message: 'Invalid goal ID' });
      return
    }

    // Get the goal to ensure user owns it
    const goal = await prisma.goal.findFirst({
      where: {
        id: goalId,
        userId: userId
      }
    });

    if (!goal) {
      res.status(404).json({ message: 'Goal not found' });
      return
    }

    // Generate a unique share token
    let shareToken;
    let isUnique = false;
    
    // Keep generating until we get a unique token
    while (!isUnique) {
      shareToken = generateShareToken();
      const existingGoal = await prisma.goal.findFirst({
        where: { shareToken }
      });
      
      if (!existingGoal) {
        isUnique = true;
      }
    }

    // Update the goal with the share token
    const updatedGoal = await prisma.goal.update({
      where: { id: goalId },
      data: { shareToken }
    });

    res.status(200).json({
      message: 'Share token generated successfully',
      shareToken,
      shareUrl: `${process.env.SHOWCASE_URL || 'https://myodyssey.me'}/goals/${shareToken}`
    });
    return
  } catch (err) {
    next(err);
  }
});

// Access a goal by share token (public endpoint)
router.get('/shared/:shareToken', async (req, res, next) => {
  try {
    const { shareToken } = req.params;

    if (!shareToken) {
      res.status(400).json({ message: 'Share token is required' });
      return
    }

    // Get token prices from cache
    const tokenPrices = await prisma.tokenPrice.findMany();
    const priceMap = tokenPrices.reduce((acc, price) => {
      acc[price.network] = price.price;
      return acc;
    }, {} as Record<string, number>);

    const goal = await prisma.goal.findFirst({
      where: {
        shareToken: shareToken
      },
      include: {
        wallets: {
          select: {
            id: true,
            publicKey: true,
            network: true,
            createdAt: true,
            lastBalance: true,
            lastBalanceUpdate: true
          }
        },
        user: {
          select: {
            id: true,
            address: true,
            profile: {
              select: {
                username: true,
                bio: true,
                avatar: true
              }
            }
          }
        },
        evaluation: true,
        tasks: {
          where: {
            status: 'COMPLETED'
          },
          select: {
            id: true,
            title: true,
            description: true,
            status: true,
            priority: true,
            sequence: true,
            deadline: true,
            createdAt: true,
            updatedAt: true
          },
          orderBy: {
            updatedAt: 'desc'
          }
        }
      }
    });

    if (!goal) {
      res.status(404).json({ message: 'Goal not found or share link invalid' });
      return
    }

    // Calculate total USD balance
    const totalUsdBalance = goal.wallets.reduce((total, wallet) => {
      const balance = parseFloat(wallet.lastBalance || '0');
      const price = priceMap[wallet.network] || 0;
      return total + (balance * price);
    }, 0);

    // Format evaluation data
    let evaluation = null;
    if (goal.weeklyTimeCommitment && goal.currentExperience && goal.availableResources && goal.startingPoint) {
      if (goal.evaluation && goal.aiReviewedAt) {
        evaluation = {
          achievabilityScore: goal.achievabilityScore || 0,
          summary: goal.aiAnalysisSummary || '',
          analysisDetails: goal.evaluation.analysisDetails || {}
        };
      }
    }

    const response = {
      ...goal,
      totalUsdBalance: totalUsdBalance.toString(),
      evaluation,
      wallets: goal.wallets.map(wallet => ({
        ...wallet,
        exchangeRate: priceMap[wallet.network] || 0
      }))
    };

    res.status(200).json(response);
    return
  } catch (err) {
    next(err);
  }
});

// Revoke share token for a goal
router.delete('/:id/share-token', authMiddleware, async (req: AuthenticatedRequest, res, next) => {
  try {
    const goalId = parseInt(req.params.id, 10);
    const userId = req.user?.id;

    if (!userId) {
      res.status(401).json({ message: 'Unauthorized' });
      return
    }

    if (isNaN(goalId)) {
      res.status(400).json({ message: 'Invalid goal ID' });
      return
    }

    // Get the goal to ensure user owns it
    const goal = await prisma.goal.findFirst({
      where: {
        id: goalId,
        userId: userId
      }
    });

    if (!goal) {
      res.status(404).json({ message: 'Goal not found' });
      return
    }

    // Remove the share token
    await prisma.goal.update({
      where: { id: goalId },
      data: { shareToken: null }
    });

    res.status(200).json({
      message: 'Share token revoked successfully'
    });
    return
  } catch (err) {
    next(err);
  }
});

export default router; 