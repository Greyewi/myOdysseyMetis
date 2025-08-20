import express, { Router } from 'express';
import { authMiddleware } from '../middlewares/auth';
import { getContractOwnerAddress } from '../services/blockchain';

const router: Router = express.Router();

interface AuthenticatedRequest extends Request {
  user?: { id: number, address: string };
}

// Test endpoint to verify contract owner configuration
router.get('/contract-owner-info', authMiddleware, async (req: AuthenticatedRequest, res, next) => {
  try {
    const ownerAddress = await getContractOwnerAddress();
    res.status(200).json({
      message: 'Contract owner configuration is valid',
      address: ownerAddress,
      configured: true
    });
  } catch (error: any) {
    res.status(500).json({
      message: 'Contract owner configuration error',
      error: error.message,
      configured: false
    });
  }
});

export default router; 