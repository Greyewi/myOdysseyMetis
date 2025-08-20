import express, { Router, Request, Response, NextFunction } from 'express';
import { GoalStatus } from '@prisma/client';
import { prisma } from '../prisma';
import { startWalletMonitoring } from '../jobs/balance-checker.job';

const router: Router = express.Router();

// Get all active (published) goals
router.get('/all', async (req, res, next) => {
  try {
    // Extract query parameters
    const filters: any = {};
    if (req.query.category) filters.category = req.query.category;
    if (req.query.network) filters.network = req.query.network;
    if (req.query.userAddress) filters.userAddress = req.query.userAddress;

    const sortField = (req.query.sortField as string) || 'createdAt';
    const sortDirection = (req.query.sortDirection as 'asc' | 'desc') || 'desc';

    // Build the where clause
    const where: any = {
      status: GoalStatus.ACTIVE,
      wallets: {
        some: {
          lastBalance: {
            not: null,
          }
        }
      }
    };

    if (filters.category) where.category = filters.category;
    if (filters.network) where.wallets = { some: { network: filters.network } };
    if (filters.userAddress) where.user = { address: filters.userAddress };

    // Build the orderBy clause
    const orderBy: any = {};
    if (sortField === 'totalUsdBalance') {
      // For totalUsdBalance sorting, we'll sort after calculating the balances
      orderBy.createdAt = 'desc'; // Default sort while we calculate balances
    } else if (sortField === 'balance') {
      orderBy.wallets = { _count: sortDirection };
    } else {
      orderBy[sortField] = sortDirection;
    }

    // Get token prices from cache
    const tokenPrices = await prisma.tokenPrice.findMany();
    const priceMap = tokenPrices.reduce((acc, price) => {
      acc[price.network] = price.price;
      return acc;
    }, {} as Record<string, number>);

    const goals = await prisma.goal.findMany({
      where,
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
        evaluation: true // Include evaluation data for estimation points
      },
      orderBy
    });

    // Calculate total USD balance and attach exchange rates
    const goalsWithBalances = goals.map(goal => {
      const totalUsdBalance = goal.wallets.reduce((total, wallet) => {
        const balance = parseFloat(wallet.lastBalance || '0');
        const price = priceMap[wallet.network] || 0;
        return total + (balance * price);
      }, 0);

      // Format evaluation data for estimation points
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

      return {
        ...goal,
        totalUsdBalance: totalUsdBalance.toString(),
        evaluation,
        wallets: goal.wallets.map(wallet => ({
          ...wallet,
          exchangeRate: priceMap[wallet.network] || 0
        }))
      };
    });

    // Sort by totalUsdBalance if that's the requested sort field
    if (sortField === 'totalUsdBalance') {
      goalsWithBalances.sort((a, b) => {
        const balanceA = parseFloat(a.totalUsdBalance);
        const balanceB = parseFloat(b.totalUsdBalance);
        return sortDirection === 'asc' ? balanceA - balanceB : balanceB - balanceA;
      });
    }

    res.status(200).json(goalsWithBalances);
    return
  } catch (err) {
    next(err);
  }
});

// Get published goal by ID (public endpoint, no auth required)
router.get('/:id', async (req, res, next) => {
  try {
    const goalId = parseInt(req.params.id, 10);

    if (isNaN(goalId)) {
      res.status(400).json({ message: 'Invalid goal ID' });
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
        id: goalId,
        status: { in: [GoalStatus.ACTIVE, GoalStatus.COMPLETED] } // Show both published and completed goals
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
        evaluation: true, // Include evaluation data for estimation points
        tasks: {
          where: {
            status: 'COMPLETED' // Only include completed tasks
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
      res.status(404).json({ message: 'Published goal not found' });
      return
    }

    // Format evaluation data for estimation points
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

    // Attach exchange rates to wallets
    const goalWithRates = {
      ...goal,
      evaluation,
      wallets: goal.wallets.map(wallet => ({
        ...wallet,
        exchangeRate: priceMap[wallet.network] || 0
      }))
    };

    res.status(200).json(goalWithRates);
    return
  } catch (err) {
    next(err);
  }
});

// Add this endpoint to check and start/reset wallet monitoring
router.get('/wallet/:id/monitoring-status', async (req: Request, res: Response, next: NextFunction) => {
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