import { ethers } from 'ethers';
import { PrismaClient } from '@prisma/client';
import { readFileSync } from 'fs';
import { join } from 'path';

// Load LazChain artifact JSON directly from artifacts directory
const LazChainArtifact = JSON.parse(
  readFileSync(join(process.cwd(), 'artifacts/contracts/LazChain.sol/LazChain.json'), 'utf-8')
);

export class MetisBlockIndexerService {
  private provider: ethers.JsonRpcProvider | ethers.WebSocketProvider;
  private contract: ethers.Contract;
  private isListening: boolean = false;
  private readonly contractAddress: string;
  private readonly prisma: PrismaClient;
  private eventHandlers: Map<string, (event: ethers.LogDescription, blockNumber?: number) => Promise<void>> = new Map();
  private pollInterval: number;
  private polling: boolean = false;
  private lastBlock: number | null = null;
  private useWebSocket: boolean;

  constructor({
    url,
    contractAddress,
    pollInterval = 5000,
  }: {
    url: string;
    contractAddress: string;
    pollInterval?: number;
  }) {
    this.useWebSocket = url.startsWith('ws://') || url.startsWith('wss://');
    this.provider = this.useWebSocket
      ? new ethers.WebSocketProvider(url)
      : new ethers.JsonRpcProvider(url);
    this.contractAddress = contractAddress;
    this.contract = new ethers.Contract(contractAddress, LazChainArtifact.abi, this.provider);
    this.prisma = new PrismaClient();
    this.pollInterval = pollInterval;
  }

  // Register event handlers (for both modes)
  on(eventName: string, handler: (event: ethers.LogDescription, blockNumber?: number) => Promise<void>) {
    this.eventHandlers.set(eventName, handler);
  }

  // Set up default event handlers for goal status updates
  setupDefaultEventHandlers() {
    const { updateGoalStatusFromBlockchain, generateGoalIdHash } = require('./blockchain');

    // GoalCommitted event handler
    this.on('GoalCommitted', async (event) => {
      console.log(`[Indexer] GoalCommitted:`, event.args);
      
      // Extract goalId hash from event
      const goalIdHash = event.args.goalId;
      if (!goalIdHash) {
        console.log(`[Indexer] No goalId found in GoalCommitted event`);
        return;
      }

      // Find the goal in database by matching the hash
      const goals = await this.prisma.goal.findMany({
        where: {
          difficulty: { in: ['MEDIUM', 'HARD', 'HARDCORE'] }
        },
        include: { user: true }
      });

      for (const goal of goals) {
        const computedHash = generateGoalIdHash(goal.userId, goal.id);
        
        if (computedHash === goalIdHash) {
          console.log(`[Indexer] Found matching goal ${goal.id} for GoalCommitted event`);
          
          // Update goal status based on blockchain funding
          const updatedGoal = await updateGoalStatusFromBlockchain(goal.id, this.prisma);
          if (updatedGoal) {
            console.log(`[Indexer] Goal ${goal.id} status updated to ${updatedGoal.status}`);
          }
          break;
        }
      }
    });

    // GoalCompleted event handler
    this.on('GoalCompleted', async (event) => {
      console.log(`[Indexer] GoalCompleted:`, event.args);
      
      const goalIdHash = event.args.goalId;
      if (!goalIdHash) {
        console.log(`[Indexer] No goalId found in GoalCompleted event`);
        return;
      }

      const goals = await this.prisma.goal.findMany({
        where: {
          difficulty: { in: ['MEDIUM', 'HARD', 'HARDCORE'] }
        },
        include: { user: true }
      });

      for (const goal of goals) {
        const computedHash = generateGoalIdHash(goal.userId, goal.id);
        
        if (computedHash === goalIdHash) {
          console.log(`[Indexer] Found matching goal ${goal.id} for GoalCompleted event`);
          
          const updatedGoal = await updateGoalStatusFromBlockchain(goal.id, this.prisma);
          if (updatedGoal) {
            console.log(`[Indexer] Goal ${goal.id} status updated to ${updatedGoal.status}`);
          }
          break;
        }
      }
    });

    // GoalClaimed event handler
    this.on('GoalClaimed', async (event) => {
      console.log(`[Indexer] GoalClaimed:`, event.args);
      
      const goalIdHash = event.args.goalId;
      if (!goalIdHash) {
        console.log(`[Indexer] No goalId found in GoalClaimed event`);
        return;
      }

      const goals = await this.prisma.goal.findMany({
        where: {
          difficulty: { in: ['MEDIUM', 'HARD', 'HARDCORE'] }
        },
        include: { user: true }
      });

      for (const goal of goals) {
        const computedHash = generateGoalIdHash(goal.userId, goal.id);
        
        if (computedHash === goalIdHash) {
          console.log(`[Indexer] Found matching goal ${goal.id} for GoalClaimed event`);
          
          const updatedGoal = await updateGoalStatusFromBlockchain(goal.id, this.prisma);
          if (updatedGoal) {
            console.log(`[Indexer] Goal ${goal.id} status updated to ${updatedGoal.status}`);
          }
          break;
        }
      }
    });

    // OwnershipTransferred event handler (just logging for now)
    this.on('OwnershipTransferred', async (event) => {
      console.log(`[Indexer] OwnershipTransferred:`, event.args);
    });
  }

  // --- SyncState helpers ---
  private async loadLastParsedBlockFromDb(): Promise<number | null> {
    try {
      const syncState = await this.prisma.syncState.findUnique({
        where: { contractId: this.contractAddress },
      });
      return syncState?.blockId ?? null;
    } catch (error) {
      console.warn('Failed to load last parsed block from SyncState:', error);
      return null;
    }
  }

  private async saveLastParsedBlockToDb(blockNumber: number): Promise<void> {
    try {
      await this.prisma.syncState.upsert({
        where: { contractId: this.contractAddress },
        update: { blockId: blockNumber, updatedAt: new Date() },
        create: { contractId: this.contractAddress, blockId: blockNumber },
      });
    } catch (error) {
      console.error('Failed to save last parsed block to SyncState:', error);
    }
  }

  // Start the indexer (polling or websocket)
  async start() {
    if (this.isListening || this.polling) {
      console.log('Already running');
      return;
    }
    if (this.useWebSocket) {
      this.isListening = true;
      console.log(`Starting WebSocket event listeners at ${this.contractAddress}`);
      try {
        for (const [eventName, handler] of this.eventHandlers) {
          console.log(`Registering handler for event: ${eventName}`);
          this.contract.on(eventName, async (...args) => {
            try {
              const event = args[args.length - 1];
              await handler(event);
            } catch (error) {
              console.error(`Error handling ${eventName} event:`, error);
            }
          });
        }
        this.provider.on('error', (error) => {
          console.error('WebSocket error:', error);
          this.isListening = false;
        });
        console.log('WebSocket event listeners registered successfully');
      } catch (error) {
        console.error('Error setting up WebSocket event listeners:', error);
        this.isListening = false;
        throw error;
      }
    } else {
      // HTTP polling mode
      this.polling = true;
      // --- Load last parsed block from SyncState, or use latest block ---
      const savedLastBlock = await this.loadLastParsedBlockFromDb();
      if (savedLastBlock !== null) {
        this.lastBlock = savedLastBlock;
        console.log(`Resuming from last parsed block in DB: ${this.lastBlock}`);
      } else {
        this.lastBlock = await this.provider.getBlockNumber();
        console.log(`No SyncState found, starting from current block: ${this.lastBlock}`);
      }
      while (this.polling) {
        const latest = await this.provider.getBlockNumber();
        if (this.lastBlock !== null && latest > this.lastBlock) {
          for (let i = this.lastBlock + 1; i <= latest; i++) {
            await this.parseBlock(i);
            await this.saveLastParsedBlockToDb(i); // --- Save progress after each block ---
          }
          this.lastBlock = latest;
        }
        await new Promise((res) => setTimeout(res, this.pollInterval));
      }
    }
  }

  stop() {
    if (this.useWebSocket) {
      if (!this.isListening) return;
      for (const [eventName] of this.eventHandlers) {
        this.contract.off(eventName);
      }
      this.isListening = false;
      (this.provider as ethers.WebSocketProvider).destroy();
    } else {
      this.polling = false;
    }
  }

  async disconnect(): Promise<void> {
    this.stop();
    await this.prisma.$disconnect();
  }

  // For HTTP polling: parse a block and emit events
  private async parseBlock(blockNumber: number) {
    const logs = await this.provider.getLogs({
      address: this.contractAddress,
      fromBlock: blockNumber,
      toBlock: blockNumber,
    });
    for (const log of logs) {
      try {
        const parsed = this.contract.interface.parseLog(log);
        const handler = this.eventHandlers.get(parsed.name);
        if (handler) {
          await handler(parsed, blockNumber);
        }
      } catch (e) {
        console.error(`Error parsing event at block ${blockNumber}:`, e);
      }
    }
  }

  isActive(): boolean {
    return this.useWebSocket ? this.isListening : this.polling;
  }

  getContractAddress(): string {
    return this.contractAddress;
  }

  getContract(): ethers.Contract {
    return this.contract;
  }

  getProvider(): ethers.JsonRpcProvider | ethers.WebSocketProvider {
    return this.provider;
  }
}
