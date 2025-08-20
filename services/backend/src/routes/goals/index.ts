import express, { Router } from 'express';
import coreGoalsRouter from './core-goals';
import walletsRouter from './wallets';
import aiFeaturesRouter from './ai-features';
import sharingRouter from './sharing';
import refundsRouter from './refunds';
import miscRouter from './misc';

const router: Router = express.Router();

// Mount sub-routers with appropriate prefixes
router.use('/', coreGoalsRouter);           // Core CRUD operations: /, /all, /:id, etc.
router.use('/wallet', walletsRouter);       // Wallet operations: /wallet/:id/update-balance, etc.
router.use('/', aiFeaturesRouter);          // AI features: /:id/reevaluate, /:id/historical-insights, /:id/mark-complete
router.use('/', sharingRouter);             // Sharing: /:id/generate-share-token, /shared/:shareToken, /:id/share-token
router.use('/', refundsRouter);             // Refunds: /:id/refund, /:id/refund-status
router.use('/', miscRouter);                // Misc: /contract-owner-info

export default router; 