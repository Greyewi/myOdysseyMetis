import express, { Router } from 'express';
import { GoalStatus } from '@prisma/client';
import { authMiddleware } from '../middlewares/auth';
import { prisma } from '../prisma';
import { evaluateGoalRealism, getGoalHistoricalInsights, validateGoalCompletion } from '../services/ai.service';
import { 
  generateGoalIdHash, 
  checkGoalOnBlockchain, 
  validateGoalReevaluation, 
  formatBlockchainGoalData,
  markGoalCompletedOnBlockchain
} from '../services/blockchain';

const router: Router = express.Router();

interface AuthenticatedRequest extends Request {
  user?: { id: number, address: string };
}

// Reevaluate goal with AI
router.post('/:id/reevaluate', authMiddleware, async (req: AuthenticatedRequest, res, next) => {
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

    // Get the goal with wallets to check funding status
    const goal = await prisma.goal.findFirst({
      where: {
        id: goalId,
        userId: userId
      },
      include: {
        wallets: {
          select: {
            id: true,
            publicKey: true,
            network: true,
            lastBalance: true,
            lastBalanceUpdate: true
          }
        },
        evaluation: true
      }
    });

    if (!goal) {
      res.status(404).json({ message: 'Goal not found' });
      return
    }

    // Check if goal has all required fields for evaluation
    if (!goal.weeklyTimeCommitment || !goal.currentExperience || !goal.availableResources || !goal.startingPoint) {
      res.status(400).json({ 
        message: 'Goal must have all required fields (weeklyTimeCommitment, currentExperience, availableResources, startingPoint) for evaluation' 
      });
      return
    }

    let canReevaluate = false;
    let blockchainData = null;

    // For MEDIUM+ difficulties, check blockchain contract
    if (goal.difficulty === 'MEDIUM' || goal.difficulty === 'HARD' || goal.difficulty === 'HARDCORE') {
      try {
        // Generate goal ID hash and check blockchain
        const goalIdHash = generateGoalIdHash(goal.userId, goal.id);
        const blockchainInfo = await checkGoalOnBlockchain(goalIdHash);
        
        // Validate if goal can be re-evaluated
        const validation = validateGoalReevaluation(blockchainInfo);
        if (!validation.valid) {
          res.status(400).json({ message: validation.error });
          return;
        }

        // Set blockchain data and re-evaluation flag
        blockchainData = blockchainInfo.data;
        canReevaluate = blockchainInfo.canReevaluate;

      } catch (blockchainError: any) {
        console.error('Blockchain check error:', blockchainError);
        res.status(500).json({ 
          message: 'Failed to check blockchain status. Please try again later.' 
        });
        return;
      }
    } else {
      // For EASY difficulty, use existing logic
      const tokenPrices = await prisma.tokenPrice.findMany();
      const priceMap = tokenPrices.reduce((acc, price) => {
        acc[price.network] = price.price;
        return acc;
      }, {} as Record<string, number>);

      canReevaluate = goal.wallets.some(wallet => {
        if (!wallet.lastBalance) return false;
        const balance = parseFloat(wallet.lastBalance);
        const price = priceMap[wallet.network] || 0;
        const balanceUSD = balance * price;
        return balanceUSD > 0.0001; // Allow re-evaluation for any positive balance
      });

      if (!canReevaluate) {
        res.status(400).json({ 
          message: 'Goal must have wallets with balance greater than $0.0001 to be re-evaluated' 
        });
        return;
      }
    }

    try {
      // Perform AI evaluation
      let evaluation;
      if (goal.difficulty === 'EASY') {
        evaluation = await evaluateGoalRealism(goal, {
          provider: 'deepseek',
          model: 'deepseek-chat',
          apiKey: process.env.DEEPSEEK_API_KEY,
          baseUrl: 'https://api.deepseek.com',
          temperature: 0.6
        });
      } else {
        evaluation = await evaluateGoalRealism(goal);
      }

      // Prepare response with blockchain data for MEDIUM+ difficulties
      const response: any = {
        message: 'Goal reevaluated successfully',
        goalId: goal.id,
        evaluation,
        reevaluatedAt: new Date()
      };

      // Include blockchain data for MEDIUM+ difficulties
      if (blockchainData) {
        response.blockchainData = formatBlockchainGoalData(blockchainData);
      }

      res.status(200).json(response);
      return
    } catch (error) {
      console.error('AI reevaluation error:', error);
      res.status(500).json({ 
        message: 'Failed to reevaluate goal. AI service may be unavailable.' 
      });
      return
    }
  } catch (err) {
    next(err);
  }
});

// Get historical insights for a goal
router.get('/:id/historical-insights', authMiddleware, async (req: AuthenticatedRequest, res, next) => {
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

    // Check if goal has all required fields for historical analysis
    if (!goal.weeklyTimeCommitment || !goal.currentExperience || !goal.availableResources || !goal.startingPoint) {
      res.status(400).json({ 
        message: 'Goal must have all AI fields completed (weekly time commitment, current experience, available resources, starting point) for historical analysis' 
      });
      return
    }

    // Get historical insights
    const historicalData = await getGoalHistoricalInsights(goal);

    if (!historicalData) {
      res.status(500).json({ message: 'Failed to generate historical insights' });
      return
    }

    res.status(200).json({
      goalId: goal.id,
      historicalInsights: historicalData.insights,
      recommendations: historicalData.recommendations,
      generatedAt: new Date().toISOString()
    });
    return
  } catch (err) {
    console.error('Historical insights error:', err);
    next(err);
  }
});

// Mark goal as complete with AI validation
router.post('/:id/mark-complete', authMiddleware, async (req: AuthenticatedRequest, res, next) => {
  try {
    const goalId = parseInt(req.params.id, 10);
    const userId = req.user?.id;

    if (!userId) {
      res.status(401).json({ message: 'Unauthorized' });
      return;
    }

    if (isNaN(goalId)) {
      res.status(400).json({ message: 'Invalid goal ID' });
      return;
    }

    // Get the goal with all related data
    const goal = await prisma.goal.findFirst({
      where: {
        id: goalId,
        userId: userId
      },
      include: {
        wallets: {
          select: {
            id: true,
            publicKey: true,
            network: true,
            lastBalance: true,
            lastBalanceUpdate: true
          }
        },
        evaluation: true,
        tasks: {
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
            sequence: 'asc'
          }
        }
      }
    });

    if (!goal) {
      res.status(404).json({ message: 'Goal not found' });
      return;
    }

    // Check if goal can be marked as complete
    if (goal.status === GoalStatus.COMPLETED) {
      res.status(400).json({ message: 'Goal is already marked as completed' });
      return;
    }

    if (goal.status === GoalStatus.FAILED) {
      res.status(400).json({ message: 'Cannot mark failed goal as completed' });
      return;
    }

    if (goal.status === GoalStatus.PENDING) {
      res.status(400).json({ message: 'Cannot mark pending goal as completed. Goal must be funded first.' });
      return;
    }

    // Check rate limiting - only allow one AI completion attempt per day
    const goalWithAttempt = goal as any; // TypeScript workaround until types update
    if (goalWithAttempt.lastAiCompletionAttempt) {
      const now = new Date();
      const lastAttempt = new Date(goalWithAttempt.lastAiCompletionAttempt);
      const hoursSinceLastAttempt = (now.getTime() - lastAttempt.getTime()) / (1000 * 60 * 60);
      
      if (hoursSinceLastAttempt < 24) {
        const hoursRemaining = Math.ceil(24 - hoursSinceLastAttempt);
        res.status(429).json({ 
          message: 'Rate limit exceeded',
          error: `AI completion validation can only be attempted once per day. Please try again in ${hoursRemaining} hour(s).`,
          nextAttemptAllowedAt: new Date(lastAttempt.getTime() + 24 * 60 * 60 * 1000).toISOString(),
          hoursRemaining
        });
        return;
      }
    }

    // Calculate task completion statistics
    const totalTasks = goal.tasks.length;
    const completedTasks = goal.tasks.filter(task => task.status === 'COMPLETED').length;
    const completionRate = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

    // Check if goal has AI evaluation
    const hasAIEvaluation = goal.evaluation && goal.aiReviewedAt;
    const achievabilityScore = goal.achievabilityScore || 0;

    // Prepare data for AI validation
    const validationData = {
      goalTitle: goal.title,
      goalDescription: goal.description,
      goalCategory: goal.category,
      deadline: goal.deadline,
      currentDate: new Date(),
      totalTasks,
      completedTasks,
      completionRate,
      hasAIEvaluation,
      achievabilityScore,
      aiAnalysisSummary: goal.aiAnalysisSummary,
      weeklyTimeCommitment: goal.weeklyTimeCommitment,
      currentExperience: goal.currentExperience,
      availableResources: goal.availableResources,
      startingPoint: goal.startingPoint,
      difficulty: goal.difficulty,
      status: goal.status
    };

    try {
      // Record the AI completion attempt in the database
      await prisma.goal.update({
        where: { id: goalId },
        data: { lastAiCompletionAttempt: new Date() }
      });

      // Call AI service to validate goal completion
      const aiValidation = await validateGoalCompletion(validationData);

      if (!aiValidation.canMarkComplete) {
        res.status(400).json({ 
          message: 'AI validation failed: Goal cannot be marked as complete',
          reason: aiValidation.reason,
          suggestions: aiValidation.suggestions || [],
          validationDetails: {
            totalTasks,
            completedTasks,
            completionRate: `${completionRate.toFixed(1)}%`,
            hasAIEvaluation,
            achievabilityScore
          }
        });
        return;
      }

      // If AI validation passes, mark goal as complete in database first
      const updatedGoal = await prisma.goal.update({
        where: { id: goalId },
        data: { 
          status: GoalStatus.COMPLETED
        },
        include: {
          wallets: {
            select: {
              id: true,
              publicKey: true,
              network: true,
              lastBalance: true,
              lastBalanceUpdate: true
            }
          }
        }
      });

      // For MEDIUM+ difficulty goals, also mark as completed on blockchain
      let blockchainResult = null;
      if (goal.difficulty === 'MEDIUM' || goal.difficulty === 'HARD' || goal.difficulty === 'HARDCORE') {
        try {
          const goalIdHash = generateGoalIdHash(goal.userId, goal.id);
          blockchainResult = await markGoalCompletedOnBlockchain(goalIdHash, true); // byAI = true since it passed AI validation
          
          if (!blockchainResult.success) {
            console.error(`[Goals] Failed to mark goal ${goalId} as completed on blockchain:`, blockchainResult.error);
          } else {
            console.log(`[Goals] Goal ${goalId} marked as completed on blockchain: ${blockchainResult.txHash}`);
          }
        } catch (error) {
          console.error(`[Goals] Error calling blockchain function for goal ${goalId}:`, error);
        }
      }

      res.status(200).json({
        message: 'Goal marked as complete successfully',
        goalId: goalId,
        goal: updatedGoal,
        aiValidation: {
          validated: true,
          reason: aiValidation.reason,
          confidence: aiValidation.confidence || 'high'
        },
        completionStats: {
          totalTasks,
          completedTasks,
          completionRate: `${completionRate.toFixed(1)}%`,
          hasAIEvaluation,
          achievabilityScore,
          completedAt: new Date()
        },
        blockchain: blockchainResult ? {
          called: true,
          success: blockchainResult.success,
          txHash: blockchainResult.txHash,
          error: blockchainResult.error
        } : {
          called: false,
          reason: 'Goal difficulty does not require blockchain transaction'
        }
      });
      return;

    } catch (aiError: any) {
      console.error('AI validation error for goal completion:', aiError);
      
      // If AI service fails, fall back to basic validation
      if (completionRate >= 80) {
        const updatedGoal = await prisma.goal.update({
          where: { id: goalId },
          data: { 
            status: GoalStatus.COMPLETED
          }
        });

        res.status(200).json({
          message: 'Goal marked as complete (fallback validation)',
          goalId: goalId,
          goal: updatedGoal,
          aiValidation: {
            validated: false,
            fallback: true,
            reason: 'AI service unavailable, used fallback validation based on task completion rate'
          },
          completionStats: {
            totalTasks,
            completedTasks,
            completionRate: `${completionRate.toFixed(1)}%`,
            hasAIEvaluation,
            achievabilityScore,
            completedAt: new Date()
          }
        });
        return;
      } else {
        res.status(500).json({ 
          message: 'AI validation service unavailable and goal does not meet minimum completion requirements',
          error: 'Minimum 80% task completion required when AI validation is unavailable',
          completionStats: {
            totalTasks,
            completedTasks,
            completionRate: `${completionRate.toFixed(1)}%`,
            minimumRequired: '80%'
          }
        });
        return;
      }
    }

  } catch (err) {
    next(err);
  }
});

export default router; 