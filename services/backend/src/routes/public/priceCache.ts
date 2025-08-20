import { Router, Request, Response } from 'express';
import { PrismaClient, WalletNetwork } from '@prisma/client';

const router: Router = Router();
const prisma = new PrismaClient();

// Get all cached prices
router.get('/prices', async (req: Request, res: Response) => {
  try {
    const prices = await prisma.tokenPrice.findMany();
    res.json(prices);
    return
  } catch (error) {
    console.error('Error fetching cached prices:', error);
    res.status(500).json({ error: 'Failed to fetch prices' });
    return
  }
});

// Get price for specific network
router.get('/prices/:network', async (req: Request, res: Response) => {
  try {
    const { network } = req.params;
    const price = await prisma.tokenPrice.findUnique({
      where: { network: network as WalletNetwork },
    });
    
    if (!price) {
      res.status(404).json({ error: 'Price not found for this network' });
      return
    }
    
    res.json(price);
    return
  } catch (error) {
    console.error('Error fetching cached price:', error);
    res.status(500).json({ error: 'Failed to fetch price' });
    return
  }
});

export default router; 