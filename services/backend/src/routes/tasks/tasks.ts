import express, { Router, Request } from 'express';
import Joi from 'joi';
import { TaskStatus, TaskPriority } from '@prisma/client';
import { authMiddleware } from '../middlewares/auth';
import { prisma } from '../prisma';
import { generateTasksForGoal } from '../services/ai.service';
import { 
  generateGoalIdHash, 
  checkGoalOnBlockchain, 
  validateGoalReevaluation 
} from '../services/blockchain';

const router: Router = express.Router();

interface AuthenticatedRequest extends Request {
  user?: { id: number, address: string };
}

// Validation schemas
const createTaskSchema = Joi.object({
  goalId: Joi.number().required(),
  title: Joi.string().max(100).required(),
  description: Joi.string().max(1000).allow('', null),
  deadline: Joi.date().iso().required(),
  priority: Joi.string().valid(...Object.values(TaskPriority)).default(TaskPriority.MEDIUM),
  sequence: Joi.number().integer().min(0).required()
});

const updateTaskSchema = Joi.object({
  title: Joi.string().max(100),
  description: Joi.string().max(1000).allow('', null),
  deadline: Joi.date().iso(),
  status: Joi.string().valid(...Object.values(TaskStatus)),
  priority: Joi.string().valid(...Object.values(TaskPriority)),
  sequence: Joi.number().integer().min(0)
});

// Create a new task
router.post('/', authMiddleware, async (req: AuthenticatedRequest, res, next) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ message: 'Unauthorized' });
      return
    }

    const { goalId, title, description, deadline, priority, sequence } = await createTaskSchema.validateAsync(req.body);

    // Verify that the goal exists and belongs to the user
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

    // Verify that the task deadline is within the goal deadline
    if (new Date(deadline) > goal.deadline) {
      res.status(400).json({ message: 'Task deadline cannot be after goal deadline' });
      return
    }

    const task = await prisma.task.create({
      data: {
        goalId,
        title,
        description,
        deadline: new Date(deadline),
        priority: priority as TaskPriority,
        sequence,
        status: TaskStatus.PENDING
      }
    });

    res.status(201).json(task);
    return
  } catch (err) {
    next(err);
  }
});

// Get all tasks for a goal
router.get('/goal/:goalId', authMiddleware, async (req: AuthenticatedRequest, res, next) => {
  try {
    const userId = req.user?.id;
    const goalId = parseInt(req.params.goalId, 10);

    if (!userId) {
      res.status(401).json({ message: 'Unauthorized' });
      return
    }

    if (isNaN(goalId)) {
      res.status(400).json({ message: 'Invalid goal ID' });
      return
    }

    // Verify that the goal belongs to the user
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

    const tasks = await prisma.task.findMany({
      where: {
        goalId: goalId
      },
      orderBy: {
        sequence: 'asc'
      }
    });

    res.status(200).json(tasks);
    return
  } catch (err) {
    next(err);
  }
});

// Get a single task
router.get('/:id', authMiddleware, async (req: AuthenticatedRequest, res, next) => {
  try {
    const userId = req.user?.id;
    const taskId = parseInt(req.params.id, 10);

    if (!userId) {
      res.status(401).json({ message: 'Unauthorized' });
      return
    }

    if (isNaN(taskId)) {
      res.status(400).json({ message: 'Invalid task ID' });
      return
    }

    const task = await prisma.task.findFirst({
      where: {
        id: taskId,
        goal: {
          userId: userId
        }
      }
    });

    if (!task) {
      res.status(404).json({ message: 'Task not found' });
      return
    }

    res.status(200).json(task);
    return
  } catch (err) {
    next(err);
  }
});

// Update a task
router.patch('/:id', authMiddleware, async (req: AuthenticatedRequest, res, next) => {
  try {
    const userId = req.user?.id;
    const taskId = parseInt(req.params.id, 10);
    const updates = await updateTaskSchema.validateAsync(req.body);

    if (!userId) {
      res.status(401).json({ message: 'Unauthorized' });
      return
    }

    if (isNaN(taskId)) {
      res.status(400).json({ message: 'Invalid task ID' });
      return
    }

    // Get the task and verify ownership
    const existingTask = await prisma.task.findFirst({
      where: {
        id: taskId,
        goal: {
          userId: userId
        }
      },
      include: {
        goal: true
      }
    });

    if (!existingTask) {
      res.status(404).json({ message: 'Task not found' });
      return
    }

    // If deadline is being updated, verify it's within goal deadline
    if (updates.deadline && new Date(updates.deadline) > existingTask.goal.deadline) {
      res.status(400).json({ message: 'Task deadline cannot be after goal deadline' });
      return
    }

    const updatedTask = await prisma.task.update({
      where: { id: taskId },
      data: updates
    });

    res.status(200).json(updatedTask);
    return
  } catch (err) {
    next(err);
  }
});

// Delete a task
router.delete('/:id', authMiddleware, async (req: AuthenticatedRequest, res, next) => {
  try {
    const userId = req.user?.id;
    const taskId = parseInt(req.params.id, 10);

    if (!userId) {
      res.status(401).json({ message: 'Unauthorized' });
      return
    }

    if (isNaN(taskId)) {
      res.status(400).json({ message: 'Invalid task ID' });
      return
    }

    // Verify task ownership
    const task = await prisma.task.findFirst({
      where: {
        id: taskId,
        goal: {
          userId: userId
        }
      }
    });

    if (!task) {
      res.status(404).json({ message: 'Task not found' });
      return
    }

    await prisma.task.delete({
      where: { id: taskId }
    });

    res.status(204).send();
    return
  } catch (err) {
    next(err);
  }
});

// Reorder tasks
router.post('/reorder', authMiddleware, async (req: AuthenticatedRequest, res, next) => {
  try {
    const userId = req.user?.id;
    const { taskIds } = req.body;

    if (!userId) {
      res.status(401).json({ message: 'Unauthorized' });
      return
    }

    if (!Array.isArray(taskIds)) {
      res.status(400).json({ message: 'taskIds must be an array' });
      return
    }

    // Verify all tasks belong to the user
    const tasks = await prisma.task.findMany({
      where: {
        id: {
          in: taskIds
        },
        goal: {
          userId: userId
        }
      }
    });

    if (tasks.length !== taskIds.length) {
      res.status(400).json({ message: 'Some tasks were not found or do not belong to you' });
      return
    }

    // Update sequence for each task
    const updates = taskIds.map((taskId, index) => {
      return prisma.task.update({
        where: { id: taskId },
        data: { sequence: index }
      });
    });

    await prisma.$transaction(updates);

    res.status(200).json({ message: 'Tasks reordered successfully' });
    return
  } catch (err) {
    next(err);
  }
});

// Add endpoint for generating tasks
router.post('/:id/generate-tasks', authMiddleware, async (req: AuthenticatedRequest, res, next) => {
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

    // Get the goal (include wallets for MEDIUM check)
    const goal = await prisma.goal.findFirst({
      where: {
        id: goalId,
        userId: userId
      },
      include: {
        wallets: true
      }
    });

    if (!goal) {
      res.status(404).json({ message: 'Goal not found' });
      return
    }

    // Check if goal has all required fields for task generation
    if (!goal.weeklyTimeCommitment || !goal.currentExperience || !goal.availableResources || !goal.startingPoint) {
      res.status(400).json({ 
        message: 'Goal is missing required fields for task generation. Please provide weeklyTimeCommitment, currentExperience, availableResources, and startingPoint.' 
      });
      return
    }

    // EASY mode: allow unlimited (up to 100) task generations
    if (goal.difficulty === 'EASY') {
      const taskCount = await prisma.task.count({ where: { goalId } });
      if (taskCount >= 100) {
        res.status(400).json({ message: 'Task generation limit reached for this goal (max 100 tasks).' });
        return;
      }
      const tasks = await generateTasksForGoal(goal, {
        provider: 'deepseek',
        model: 'deepseek-chat',
        apiKey: process.env.DEEPSEEK_API_KEY,
        baseUrl: 'https://api.deepseek.com',
        temperature: 0.6
      });
      res.status(200).json(tasks);
      return;
    }

    // MEDIUM+ mode: check blockchain contract for funding
    if (goal.difficulty === 'MEDIUM' || goal.difficulty === 'HARD' || goal.difficulty === 'HARDCORE') {
      try {
        // Generate goal ID hash and check blockchain
        const goalIdHash = generateGoalIdHash(goal.userId, goal.id);
        const blockchainInfo = await checkGoalOnBlockchain(goalIdHash);
        
        // Validate if goal can generate tasks
        const validation = validateGoalReevaluation(blockchainInfo);
        if (!validation.valid) {
          res.status(400).json({ message: validation.error });
          return;
        }

        // Generate tasks using blockchain-validated goal
        const tasks = await generateTasksForGoal(goal);
        res.status(200).json({
          tasks,
          blockchainData: {
            stakedAmount: blockchainInfo.data?.amount.toString(),
            completed: blockchainInfo.data?.completed,
            claimed: blockchainInfo.data?.claimed,
            validatedByAI: blockchainInfo.data?.validatedByAI
          }
        });
        return;

      } catch (blockchainError: any) {
        console.error('Blockchain check error for task generation:', blockchainError);
        res.status(500).json({ 
          message: 'Failed to check blockchain status for task generation. Please try again later.' 
        });
        return;
      }
    }

    // Other difficulties: keep current logic or restrict
    res.status(400).json({ message: 'Task generation is only available for EASY, MEDIUM, HARD, and HARDCORE goals.' });
    return;
  } catch (err) {
    next(err);
  }
});

export default router; 