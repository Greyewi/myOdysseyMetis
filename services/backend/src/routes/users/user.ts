import express, { Router, Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { verifyMessage } from 'viem/utils'
import { PrismaClient } from '@prisma/client';
import { randomUUID } from 'crypto';
import { authMiddleware } from '../middlewares/auth';

const prisma = new PrismaClient();
const router = express.Router();

// Generate a nonce
router.get('/nonce', async (req, res) => {
  try {
    const { address } = req.query

    if (!address || typeof address !== 'string') {
      res.status(400).json({ error: 'Missing or invalid address' })
      return
    }

    const normalizedAddress = address.toLowerCase()
    const nonce = randomUUID()

    const existingWallet = await prisma.user.findUnique({
      where: { address: normalizedAddress }
    })

    if (existingWallet) {
      await prisma.user.update({
        where: { address: normalizedAddress },
        data: { nonce: nonce }
      })
    } else {
      // Create new user with empty profile
      const newUser = await prisma.user.create({
        data: { 
          address: normalizedAddress,
          nonce: nonce,
          profile: {
            create: {
              username: '',
              email: '',
              bio: '',
              avatar: ''
            }
          }
        }
      })
    }

    res.json({ nonce })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Internal server error' })
    return
  }
})

router.post('/verify', async (req, res) => {
  try {
    const { address, signature } = req.body

    if (!address || !signature) {
      res.status(400).json({ error: 'Missing address or signature' })
      return
    }

    const normalizedAddress = address.toLowerCase()
    const user = await prisma.user.findUnique({
      where: { address: normalizedAddress }
    })

    if (!user || !user.nonce) {
      res.status(400).json({ error: 'Unknown wallet or missing nonce' })
      return
    }

    const message = `Sign this message to authenticate with My Odyssey. Nonce: ${user.nonce}`;

    const isValid = await verifyMessage({
      address: normalizedAddress,
      message,
      signature
    })

    if (!isValid) {
      res.status(401).json({ error: 'Invalid signature' })
      return
    }

    // Generate JWT
    const token = jwt.sign(
      { address: normalizedAddress },
      process.env.JWT_SECRET!,
      { expiresIn: '7d' }
    )

    // Обнуляем nonce, чтобы нельзя было использовать второй раз
    await prisma.user.update({
      where: { address: normalizedAddress },
      data: { nonce: null }
    })

    res.json({ token })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Internal server error' })
    return
  }
})

router.get('/session', (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.send(req.session.siwe);
});

// Sign out
router.post("/logout", (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error("Error destroying session:", err);
      return res.status(500).json({ error: "Failed to log out" });
    }
    res.json({ success: true });
  });
});

// Create or update profile
router.post('/profile', authMiddleware, async (req, res) => {
  try {
    const { username, email, bio, avatar } = req.body;
    const { address } = req.user!;

    // Find user
    const user = await prisma.user.findUnique({
      where: { address },
      include: { profile: true }
    });

    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return
    }

    // Create or update profile
    const profile = await prisma.profile.upsert({
      where: { id: user.profile?.id || 0 },
      update: {
        username,
        email,
        bio,
        avatar
      },
      create: {
        username,
        email,
        bio,
        avatar,
        users: {
          connect: { id: user.id }
        }
      }
    });

    res.json({ success: true, profile });
    return
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
    return
  }
});

// Link new wallet to profile
router.post('/link-wallet', authMiddleware, async (req, res) => {
  try {
    const { address: newAddress, signature } = req.body;
    const { address: authenticatedAddress } = req.user!;

    if (!newAddress || !signature) {
      res.status(400).json({ error: 'Missing address or signature' });
      return
    }

    const normalizedNewAddress = newAddress.toLowerCase();
    const normalizedAuthAddress = authenticatedAddress.toLowerCase();

    // Get authenticated user with profile
    const authUser = await prisma.user.findUnique({
      where: { address: normalizedAuthAddress },
      include: { profile: true }
    });

    if (!authUser || !authUser.profile) {
      res.status(404).json({ error: 'Profile not found. Please create a profile first.' });
      return
    }

    // Verify signature
    const isValid = await verifyMessage({
      address: normalizedNewAddress,
      message: `Link this wallet to your CryptoGoals profile. Authenticated address: ${normalizedAuthAddress}`,
      signature
    });

    if (!isValid) {
      res.status(401).json({ error: 'Invalid signature' });
      return
    }

    // Check if wallet is already linked to another profile
    const existingWallet = await prisma.user.findUnique({
      where: { address: normalizedNewAddress },
      include: { profile: true }
    });

    if (existingWallet?.profile && existingWallet.profile.id !== authUser.profile.id) {
      res.status(400).json({ error: 'Wallet is already linked to another profile' });
      return
    }

    // Link wallet to profile
    const updatedWallet = await prisma.user.upsert({
      where: { address: normalizedNewAddress },
      update: {
        profile: {
          connect: { id: authUser.profile.id }
        }
      },
      create: {
        address: normalizedNewAddress,
        profile: {
          connect: { id: authUser.profile.id }
        }
      }
    });

    res.json({
      success: true,
      wallet: {
        address: updatedWallet.address,
        walletType: updatedWallet.walletType,
        createdAt: updatedWallet.createdAt
      }
    });
    return
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
    return
  }
});

// Get profile with all linked wallets
router.get('/profile', authMiddleware, async (req, res) => {
  try {
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const { address } = req.user!;

    const user = await prisma.user.findUnique({
      where: { address },
      include: {
        profile: {
          include: {
            users: {
              select: {
                id: true,
                address: true,
                walletType: true,
                createdAt: true
              }
            }
          }
        }
      }
    });

    if (!user) {
      res.status(404).json({ error: 'Profile not found' });
      return
    }

    res.json({
      profile: {
        id: user.profile.id,
        username: user.profile.username,
        email: user.profile.email,
        bio: user.profile.bio,
        avatar: user.profile.avatar,
        wallets: user.profile.users
      }
    });
    return
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
    return
  }
});

export default router;
