import express, { Router } from 'express';
import priceCacheRouter from './priceCache';
import publicGoalsRouter from './publicGoals';

const router: Router = express.Router();

// Mount public routes
router.use('/price-cache', priceCacheRouter);
router.use('/goals', publicGoalsRouter);

export default router; 