import express, { Router } from 'express';
import goalsRouter from './goals';
import usersRouter from './users';
import tasksRouter from './tasks';
import publicRouter from './public';

const router: Router = express.Router();

// Mount all routers
router.use('/goals', goalsRouter);
router.use('/users', usersRouter);
router.use('/tasks', tasksRouter);
router.use('/public', publicRouter);

export default router;

// Export individual routers for direct access if needed
export {
  goalsRouter,
  usersRouter,
  tasksRouter,
  publicRouter
}; 