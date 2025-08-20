import express, { Router, Request, Response, NextFunction } from 'express';
import Joi from 'joi';
import { GoalStatus, WalletNetwork, Goal, Wallet, GoalCategory, GoalDifficulty } from '@prisma/client';
import { authMiddleware } from '../middlewares/auth';
import { prisma } from '../prisma';
import { generateWallet } from '../services/wallet';
import { upload, compressImage } from '../services/image';
import path from 'path';
import { File } from 'multer';
import fs from 'fs';
import { 
  generateGoalIdHash, 
  checkGoalOnBlockchain, 
  formatBlockchainGoalData
} from '../services/blockchain';

const router: Router = express.Router();

interface AuthenticatedRequest extends Request {
  user?: { id: number, address: string };
  file?: File;
}

// Validation schemas
const createGoalSchema = Joi.object({
  title: Joi.string().max(150).required(),
  description: Joi.string().required(),
  deadline: Joi.date().iso().required(),
  network: Joi.string().valid(...Object.values(WalletNetwork)).required(),
  category: Joi.string().valid(...Object.values(GoalCategory)).required(),
  image: Joi.any(),
  weeklyTimeCommitment: Joi.number().integer().min(1).max(168).optional(),
  currentExperience: Joi.string().max(500).optional(),
  availableResources: Joi.string().max(500).optional(),
  startingPoint: Joi.string().max(500).optional()
});

const patchGoalSchema = Joi.object({
  title: Joi.string().max(150),
  description: Joi.string(),
  deadline: Joi.date().iso(),
  network: Joi.string().valid(...Object.values(WalletNetwork)),
  category: Joi.string().valid(...Object.values(GoalCategory)),
  image: Joi.any(),
  weeklyTimeCommitment: Joi.number().integer().min(1).max(168),
  currentExperience: Joi.string().max(500),
  availableResources: Joi.string().max(500),
  startingPoint: Joi.string().max(500)
});

const updateGoalStatusSchema = Joi.object({
  status: Joi.string().valid(...Object.values(GoalStatus)).required()
});

const updateDifficultySchema = Joi.object({
  difficulty: Joi.string().valid(...Object.values(GoalDifficulty)).required()
});

// Helper functions
const updateGoalStatus = async (goal: Goal & { wallets?: Wallet[] }) => {
  let newStatus = goal.status;

  // For MEDIUM+ difficulties, don't automatically update to FUNDED based on backend wallet balances
  if (goal.difficulty === 'MEDIUM' || goal.difficulty === 'HARD' || goal.difficulty === 'HARDCORE') {
    return newStatus;
  }

  // For EASY difficulty, use backend wallet balance logic
  if (
    goal.status === GoalStatus.PENDING && 
    goal.wallets?.some(wallet => 
      wallet.lastBalance && 
      wallet.lastBalance !== '0' &&
      parseFloat(wallet.lastBalance) > 0
    )
  ) {
    return GoalStatus.FUNDED;
  }

  return newStatus;
};

const validateStatusTransition = (currentStatus: GoalStatus, newStatus: GoalStatus): boolean => {
  switch (currentStatus) {
    case GoalStatus.PENDING:
      return newStatus === GoalStatus.PENDING;
    case GoalStatus.FUNDED:
      return newStatus === GoalStatus.ACTIVE || newStatus === GoalStatus.FUNDED;
    case GoalStatus.ACTIVE:
      return newStatus === GoalStatus.COMPLETED || 
             newStatus === GoalStatus.FAILED || 
             newStatus === GoalStatus.FUNDED;
    case GoalStatus.COMPLETED:
    case GoalStatus.FAILED:
      return false;
    default:
      return false;
  }
};

// Interfaces for filtering and sorting
interface GoalFilters {
  category?: GoalCategory;
  network?: WalletNetwork;
  userAddress?: string;
}

// Create goal and wallet
router.post('/', authMiddleware, upload.single('image'), async (req: AuthenticatedRequest, res, next) => {
  try {
    const { 
      description, 
      title, 
      deadline, 
      network, 
      category, 
    } = await createGoalSchema.validateAsync(req.body);

    const userId = req.user?.id;

    if (!userId) {
      res.status(401).json({ message: 'Unauthorized' });
      return
    }

    // Validate deadline is at least tomorrow
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);
    
    const deadlineDate = new Date(deadline);
    if (deadlineDate < tomorrow) {
      res.status(400).json({ message: 'Deadline must be at least tomorrow' });
      return
    }

    const { privateKey, publicKey } = generateWallet(network as WalletNetwork);

    let imagePath = null;
    if (req.file) {
      const uploadDir = path.join(process.cwd(), 'uploads');
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }

      const compressedImagePath = await compressImage(req.file.path);
      imagePath = path.relative(process.cwd(), compressedImagePath);
    }

    // Create goal and wallet in a transaction
    const goal = await prisma.goal.create({
      data: {
        description,
        deadline: new Date(deadline),
        status: GoalStatus.PENDING,
        category: category as GoalCategory,
        image: imagePath,
        title,
        userId,
        wallets: {
          create: {
            privateKey,
            publicKey,
            network: network as WalletNetwork,
            userId
          }
        }
      },
      include: {
        wallets: true
      }
    });

    res.status(201).json({
      ...goal,
      wallet: goal.wallets[0] ? {
        publicKey: goal.wallets[0].publicKey,
        network: goal.wallets[0].network
      } : undefined,
    });
    return
  } catch (err) {
    next(err);
  }
});

// Get all active (published) goals
router.get('/all', async (req, res, next) => {
  try {
    const filters: GoalFilters = {};
    if (req.query.category) filters.category = req.query.category as GoalCategory;
    if (req.query.network) filters.network = req.query.network as WalletNetwork;
    if (req.query.userAddress) filters.userAddress = req.query.userAddress as string;

    const sortField = (req.query.sortField as string) || 'createdAt';
    const sortDirection = (req.query.sortDirection as 'asc' | 'desc') || 'desc';

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

    const orderBy: any = {};
    if (sortField === 'balance') {
      orderBy.wallets = { _count: sortDirection };
    } else {
      orderBy[sortField] = sortDirection;
    }

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
            address: true
          }
        }
      },
      orderBy
    });

    res.status(200).json(goals);
    return
  } catch (err) {
    next(err);
  }
});

// Get my goals
router.get('/', authMiddleware, async (req: AuthenticatedRequest, res, next) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      res.status(401).json({ message: 'Unauthorized' });
      return
    }

    const goals = await prisma.goal.findMany({
      where: { 
        userId
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
          },
          orderBy: {
            id: 'desc'
          }
        },
        evaluation: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    // Add evaluation data to each goal
    const goalsWithEvaluation = goals.map(goal => {
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
        evaluation
      };
    });

    res.status(200).json(goalsWithEvaluation);
    return
  } catch (err) {
    next(err);
  }
});

// Get single goal by ID
router.get('/:id', authMiddleware, async (req: AuthenticatedRequest, res, next) => {
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
            createdAt: true,
            lastBalance: true,
            lastBalanceUpdate: true,
            refundAddress: true
          },
          orderBy: {
            id: 'desc'
          }
        },
        evaluation: true
      }
    });

    if (!goal) {
      res.status(404).json({ message: 'Goal not found' });
      return
    }

    // Add evaluation data if available
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
      evaluation
    };

    res.status(200).json(response);
    return
  } catch (err) {
    next(err);
  }
});

// Update goal
router.patch('/:id', authMiddleware, upload.single('image'), async (req: AuthenticatedRequest, res, next) => {
  try {
    const goalId = parseInt(req.params.id, 10);
    const userId = req.user?.id;
    const { 
      title, 
      description, 
      category, 
      weeklyTimeCommitment, 
      currentExperience, 
      availableResources, 
      startingPoint,
      deadline 
    } = await patchGoalSchema.validateAsync(req.body);

    if (!userId) {
      res.status(401).json({ message: 'Unauthorized' });
      return
    }

    if (isNaN(goalId)) {
      res.status(400).json({ message: 'Invalid goal ID' });
      return
    }

    // Validate deadline if being updated
    if (deadline) {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(0, 0, 0, 0);
      
      const deadlineDate = new Date(deadline);
      if (deadlineDate < tomorrow) {
        res.status(400).json({ message: 'Deadline must be at least tomorrow' });
        return
      }
    }

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

    // Check if goal can be edited
    const nonEditableStatuses: GoalStatus[] = [GoalStatus.COMPLETED, GoalStatus.FAILED];
    if (nonEditableStatuses.includes(existingGoal.status)) {
      res.status(400).json({ 
        message: 'Cannot edit goals with COMPLETED or FAILED status' 
      });
      return
    }

    // Prevent deadline editing for published goals
    if (deadline && existingGoal.status === GoalStatus.ACTIVE) {
      res.status(400).json({ 
        message: 'Cannot edit deadline for published goals' 
      });
      return
    }

    // Difficulty-based edit restrictions
    const currentDifficulty = existingGoal.difficulty;
    const aiFields = {
      ...(weeklyTimeCommitment !== undefined && { weeklyTimeCommitment: weeklyTimeCommitment ? parseInt(weeklyTimeCommitment, 10) : null }),
      ...(currentExperience !== undefined && { currentExperience }),
      ...(availableResources !== undefined && { availableResources }),
      ...(startingPoint !== undefined && { startingPoint })
    };

    let imagePath = existingGoal.image;
    if (req.file) {
      const compressedImagePath = await compressImage(req.file.path);
      imagePath = path.relative(process.cwd(), compressedImagePath);
    }

    // Check if goal can be edited based on difficulty
    if (currentDifficulty === GoalDifficulty.MEDIUM || 
        currentDifficulty === GoalDifficulty.HARD || 
        currentDifficulty === GoalDifficulty.HARDCORE) {
      res.status(403).json({ 
        message: `Cannot edit goals with ${currentDifficulty} difficulty. Please contact an administrator for changes.` 
      });
      return;
    }

    // Update the goal (only for EASY difficulty)
    const updatedGoal = await prisma.goal.update({
      where: { id: goalId },
      data: {
        ...(title && { title }),
        ...(description && { description }),
        ...(category && { category: category as GoalCategory }),
        ...(deadline && { deadline: new Date(deadline) }),
        ...(imagePath !== undefined && { image: imagePath }),
        ...aiFields
      },
      include: {
        wallets: {
          select: {
            id: true,
            publicKey: true,
            network: true,
            createdAt: true,
            lastBalance: true,
            lastBalanceUpdate: true,
            refundAddress: true
          }
        }
      }
    });

    res.status(200).json(updatedGoal);
    return
  } catch (err) {
    next(err);
  }
});

// Update goal status
router.patch('/:id/status', authMiddleware, async (req: AuthenticatedRequest, res, next) => {
  try {
    const goalId = parseInt(req.params.id, 10);
    const userId = req.user?.id;
    const { status } = await updateGoalStatusSchema.validateAsync(req.body);

    if (!userId) {
      res.status(401).json({ message: 'Unauthorized' });
      return
    }

    if (isNaN(goalId)) {
      res.status(400).json({ message: 'Invalid goal ID' });
      return
    }

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

    // Check if status is actually changing
    if (status === existingGoal.status) {
      res.status(200).json(existingGoal);
      return
    }

    // Handle status changes for different difficulties
    if (status !== existingGoal.status) {
      // For MEDIUM+ difficulties, check blockchain funding
      if (existingGoal.difficulty === 'MEDIUM' || existingGoal.difficulty === 'HARD' || existingGoal.difficulty === 'HARDCORE') {
        try {
          const goalIdHash = generateGoalIdHash(existingGoal.userId, existingGoal.id);
          const blockchainInfo = await checkGoalOnBlockchain(goalIdHash);
          
          // For FUNDED status, require blockchain funding
          if (status === GoalStatus.FUNDED) {
            if (!blockchainInfo.exists || !blockchainInfo.data || Number(blockchainInfo.data.amount) === 0) {
              res.status(400).json({ 
                message: 'Cannot change status to FUNDED without blockchain funding for MEDIUM+ difficulties' 
              });
              return;
            }
          }
          
          // For ACTIVE status, require blockchain funding
          if (status === GoalStatus.ACTIVE) {
            if (!blockchainInfo.exists || !blockchainInfo.data || Number(blockchainInfo.data.amount) === 0) {
              res.status(400).json({ 
                message: 'Cannot publish goal without blockchain funding for MEDIUM+ difficulties' 
              });
              return;
            }
          }
          
        } catch (blockchainError: any) {
          console.error('Blockchain check error for status update:', blockchainError);
          res.status(500).json({ 
            message: 'Failed to check blockchain status. Please try again later.' 
          });
          return;
        }
      } else {
        // For EASY difficulty, check backend wallet balance
        if (status !== GoalStatus.PENDING && existingGoal.wallets?.some(wallet => wallet.lastBalance === '0') === true) {
          res.status(400).json({ 
            message: 'Cannot change status to non-PENDING when wallets have no balance' 
          });
          return;
        }
      }
    }

    // Validate status transition
    if (!validateStatusTransition(existingGoal.status, status)) {
      res.status(400).json({ 
        message: 'Invalid status transition' 
      });
      return
    }

    // Update the goal status
    const updatedGoal = await prisma.goal.update({
      where: { id: goalId },
      data: { status },
      include: {
        wallets: {
          select: {
            id: true,
            publicKey: true,
            network: true,
            createdAt: true,
            lastBalance: true,
            lastBalanceUpdate: true,
            refundAddress: true
          }
        }
      }
    });

    res.status(200).json(updatedGoal);
    return
  } catch (err) {
    next(err);
  }
});

// Update goal difficulty
router.patch('/:id/difficulty', authMiddleware, async (req: AuthenticatedRequest, res, next) => {
  try {
    const goalId = parseInt(req.params.id, 10);
    const userId = req.user?.id;
    const { difficulty } = await updateDifficultySchema.validateAsync(req.body);

    if (!userId) {
      res.status(401).json({ message: 'Unauthorized' });
      return;
    }

    if (isNaN(goalId)) {
      res.status(400).json({ message: 'Invalid goal ID' });
      return;
    }

    const existingGoal = await prisma.goal.findFirst({
      where: { id: goalId, userId },
    });

    if (!existingGoal) {
      res.status(404).json({ message: 'Goal not found' });
      return;
    }

    const currentDifficulty = existingGoal.difficulty;

    if (currentDifficulty === GoalDifficulty.UNSET) {
      // Only allow changing difficulty from UNSET to a valid value
    } else if (currentDifficulty === GoalDifficulty.EASY) {
      // Allow EASY goals to upgrade to higher difficulties, but not downgrade
      if (difficulty === GoalDifficulty.EASY) {
        // No change needed
      } else if ([GoalDifficulty.MEDIUM, GoalDifficulty.HARD, GoalDifficulty.HARDCORE].includes(difficulty)) {
        // Allow upgrade from EASY to higher difficulties
      } else {
        res.status(400).json({ message: 'Invalid difficulty transition from EASY.' });
        return;
      }
    } else if ([GoalDifficulty.MEDIUM, GoalDifficulty.HARD, GoalDifficulty.HARDCORE].includes(currentDifficulty)) {
      // Cannot change difficulty once set to MEDIUM, HARD, or HARDCORE
      if (difficulty !== currentDifficulty) {
        res.status(400).json({ message: 'Cannot change difficulty once set to MEDIUM, HARD, or HARDCORE.' });
        return;
      }
    }

    // If setting to EASY and current status is PENDING or FUNDED, set status to ACTIVE
    let updatedGoal;
    if (difficulty === GoalDifficulty.EASY && (existingGoal.status === GoalStatus.PENDING || existingGoal.status === GoalStatus.FUNDED)) {
      updatedGoal = await prisma.goal.update({
        where: { id: goalId },
        data: { difficulty, status: GoalStatus.ACTIVE },
      });
    } else {
      // Only update if the difficulty is actually changing
      if (difficulty === currentDifficulty) {
        res.status(200).json(existingGoal);
        return;
      }
      updatedGoal = await prisma.goal.update({
        where: { id: goalId },
        data: { difficulty },
      });
    }

    res.status(200).json(updatedGoal);
  } catch (err) {
    next(err);
  }
});

// Delete goal
router.delete('/:id', authMiddleware, async (req: AuthenticatedRequest, res, next) => {
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

    // Only allow deletion of PENDING goals or EASY or UNSET difficulty
    if (existingGoal.status !== GoalStatus.PENDING && existingGoal.difficulty !== GoalDifficulty.EASY) {
      res.status(400).json({ 
        message: 'Can only delete goals with PENDING status' 
      });
      return
    }

    // Prevent deletion of MEDIUM+ difficulty goals
    if (existingGoal.difficulty === 'MEDIUM' || existingGoal.difficulty === 'HARD' || existingGoal.difficulty === 'HARDCORE') {
      res.status(400).json({ 
        message: 'Cannot delete goals with MEDIUM, HARD, or HARDCORE difficulty as they are committed to the blockchain' 
      });
      return
    }

    // Create transaction operations
    const operations = [];

    // Add task deletions if they exist
    operations.push(
      prisma.task.deleteMany({
        where: { goalId: goalId }
      })
    );

    // Add evaluation deletion if it exists
    operations.push(
      prisma.goalEvaluation.deleteMany({
        where: { goalId: goalId }
      })
    );

    // Add wallet deletions if they exist
    existingGoal.wallets.forEach(wallet => {
      operations.push(
        prisma.wallet.delete({
          where: { id: wallet.id }
        })
      );
    });

    // Add goal deletion
    operations.push(
      prisma.goal.delete({
        where: { id: goalId }
      })
    );

    // Execute transaction
    await prisma.$transaction(operations);

    res.status(204).send();
    return
  } catch (err) {
    next(err);
  }
});

// Upload image for goal
router.post('/:id/image', authMiddleware, upload.single('image'), async (req: AuthenticatedRequest, res, next) => {
  try {
    const goalId = parseInt(req.params.id, 10);
    const userId = req.user?.id;

    if (!userId) {
      res.status(401).json({ message: 'Unauthorized' });
      return
    }

    if (!req.file) {
      res.status(400).json({ message: 'No image file provided' });
      return
    }

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

    // Compress the image
    const compressedImagePath = await compressImage(req.file.path);
    const relativePath = path.relative(process.cwd(), compressedImagePath);

    // Update the goal with the image path
    const updatedGoal = await prisma.goal.update({
      where: { id: goalId },
      data: {
        image: relativePath
      }
    });

    res.status(200).json({
      message: 'Image uploaded successfully',
      image: relativePath
    });
    return
  } catch (err) {
    next(err);
  }
});

export default router; 