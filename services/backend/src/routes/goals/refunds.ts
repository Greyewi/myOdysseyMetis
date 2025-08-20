import express, { Router } from 'express';
import { GoalStatus } from '@prisma/client';
import { authMiddleware } from '../middlewares/auth';
import { prisma } from '../prisma';
import { refundService } from '../services/refund.service';

const router: Router = express.Router();

interface AuthenticatedRequest extends Request {
  user?: { id: number, address: string };
}

// Process refund for a completed goal
router.post('/:id/refund', authMiddleware, async (req: AuthenticatedRequest, res, next) => {
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

    // Get the goal to ensure user owns it and it's completed
    const goal = await prisma.goal.findFirst({
      where: {
        id: goalId,
        userId: userId
      },
      include: {
        wallets: {
          where: {
            refundAddress: { not: null }
          }
        }
      }
    });

    if (!goal) {
      res.status(404).json({ message: 'Goal not found' });
      return
    }

    if (goal.status !== GoalStatus.COMPLETED) {
      res.status(400).json({ 
        message: 'Can only process refunds for completed goals' 
      });
      return
    }

    if (!goal.wallets || goal.wallets.length === 0) {
      res.status(400).json({ 
        message: 'No wallets with refund addresses found for this goal' 
      });
      return
    }

    console.log(`[Goals] Processing refund for goal ${goalId}`);

    // Process the refunds using the refund service
    const refundSummary = await refundService.processGoalRefunds(goalId);

    console.log(`[Goals] Refund processing completed for goal ${goalId}:`, {
      total: refundSummary.totalRefunds,
      successful: refundSummary.successfulRefunds,
      failed: refundSummary.failedRefunds
    });

    res.status(200).json({
      message: 'Refund processing completed',
      goalId,
      summary: {
        totalRefunds: refundSummary.totalRefunds,
        successfulRefunds: refundSummary.successfulRefunds,
        failedRefunds: refundSummary.failedRefunds,
        results: refundSummary.results,
        completedAt: refundSummary.completedAt
      }
    });
    return
  } catch (err) {
    console.error(`[Goals] Error processing refund for goal:`, err);
    next(err);
  }
});

// Get refund status for a goal
router.get('/:id/refund-status', authMiddleware, async (req: AuthenticatedRequest, res, next) => {
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

    // Get refund status from the refund service
    const refundStatus = await refundService.getRefundStatus(goalId);

    res.status(200).json({
      goalId,
      goalStatus: goal.status,
      ...refundStatus
    });
    return
  } catch (err) {
    next(err);
  }
});

export default router; 