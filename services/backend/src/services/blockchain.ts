import { ethers } from 'ethers';
import { WalletNetwork } from '@prisma/client';
import { TronWeb } from 'tronweb';

// RPC providers configuration
const NETWORK_PROVIDERS = {
  // [WalletNetwork.TRC20]: 'https://api.trongrid.io',
  [WalletNetwork.ERC20]: 'https://mainnet.infura.io/v3/5380a1a6288148fb96795c5fdca03435',
  [WalletNetwork.ARBITRUM]: 'https://arb1.arbitrum.io/rpc',
  [WalletNetwork.OPTIMISM]: 'https://mainnet.optimism.io',
  [WalletNetwork.POLYGON]: 'https://polygon-rpc.com',
  [WalletNetwork.BSC]: 'https://bsc-dataseed.binance.org/',
  [WalletNetwork.METIS]: 'https://hyperion-testnet.metisdevops.link',
  // [WalletNetwork.SOLANA]: 'https://api.mainnet-beta.solana.web3.com',
  // [WalletNetwork.BITCOIN]: 'https://btc.getblock.io/mainnet/'
};

// Cache providers to avoid creating new instances for every request
const providers: { [key in WalletNetwork]?: ethers.Provider } = {};

export async function getWalletBalance(address: string, network: WalletNetwork): Promise<string> {
  try {
    if (network === WalletNetwork.TRC20) {
      const tronWeb = new TronWeb({
        fullHost: NETWORK_PROVIDERS[WalletNetwork.TRC20]
      });
      const balance = await tronWeb.trx.getBalance(address);
      return ethers.formatEther(balance.toString());
    }

    if (!providers[network]) {
      providers[network] = new ethers.JsonRpcProvider(NETWORK_PROVIDERS[network]);
    }

    const provider = providers[network]!;
    const balance = await provider.getBalance(address);
    return ethers.formatEther(balance);
  } catch (error) {
    console.error(`Error fetching balance for ${network}:`, error);
    return '0';
  }
}

export interface TransactionResult {
  success: boolean;
  txHash?: string;
  error?: string;
  gasUsed?: string;
  actualAmount?: string;
}

export async function sendTransaction(
  privateKey: string,
  toAddress: string,
  amount: string,
  network: WalletNetwork
): Promise<TransactionResult> {
  try {
    if (network === WalletNetwork.TRC20) {
      return await sendTronTransaction(privateKey, toAddress, amount);
    }

    return await sendEVMTransaction(privateKey, toAddress, amount, network);
  } catch (error) {
    console.error(`Error sending transaction on ${network}:`, error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

export async function sendMaximumAmount(
  privateKey: string,
  toAddress: string,
  network: WalletNetwork
): Promise<TransactionResult> {
  try {
    if (network === WalletNetwork.TRC20) {
      return await sendMaximumTronTransaction(privateKey, toAddress);
    }

    return await sendMaximumEVMTransaction(privateKey, toAddress, network);
  } catch (error) {
    console.error(`Error sending maximum transaction on ${network}:`, error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

async function sendEVMTransaction(
  privateKey: string,
  toAddress: string,
  amount: string,
  network: WalletNetwork
): Promise<TransactionResult> {
  try {
    if (!providers[network]) {
      providers[network] = new ethers.JsonRpcProvider(NETWORK_PROVIDERS[network]);
    }

    const provider = providers[network]!;
    const wallet = new ethers.Wallet(privateKey, provider);
    
    // Parse the amount to wei
    const amountWei = ethers.parseEther(amount);
    
    // Get current balance
    const balance = await provider.getBalance(wallet.address);
    
    // Estimate gas
    const gasLimit = await provider.estimateGas({
      to: toAddress,
      value: amountWei
    });
    
    // Get gas price
    const gasPrice = await provider.getFeeData();
    const gasCost = gasLimit * (gasPrice.gasPrice || BigInt(0));
    
    // Check if we have enough balance for the transaction + gas
    if (balance < amountWei + gasCost) {
      // Calculate maximum amount we can send (balance - gas)
      const maxSendable = balance - gasCost;
      
      if (maxSendable <= 0) {
        return {
          success: false,
          error: 'Insufficient balance to cover gas fees'
        };
      }
      
      // Send the maximum possible amount
      const tx = await wallet.sendTransaction({
        to: toAddress,
        value: maxSendable,
        gasLimit: gasLimit,
        gasPrice: gasPrice.gasPrice
      });
      
      const receipt = await tx.wait();
      
      return {
        success: true,
        txHash: tx.hash,
        gasUsed: receipt?.gasUsed?.toString(),
        actualAmount: ethers.formatEther(maxSendable)
      };
    }
    
    // Send the requested amount
    const tx = await wallet.sendTransaction({
      to: toAddress,
      value: amountWei,
      gasLimit: gasLimit,
      gasPrice: gasPrice.gasPrice
    });
    
    const receipt = await tx.wait();
    
    return {
      success: true,
      txHash: tx.hash,
      gasUsed: receipt?.gasUsed?.toString(),
      actualAmount: amount
    };
    
  } catch (error) {
    console.error(`Error sending EVM transaction:`, error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

async function sendTronTransaction(
  privateKey: string,
  toAddress: string,
  amount: string
): Promise<TransactionResult> {
  try {
    const tronWeb = new TronWeb({
      fullHost: NETWORK_PROVIDERS[WalletNetwork.TRC20],
      privateKey: privateKey
    });
    
    // Convert amount to SUN (TRX base unit) - TronWeb expects number
    const amountTrx = parseFloat(amount);
    const amountSun = tronWeb.toSun(amountTrx);
    
    // Get the sender address from private key
    const fromAddress = tronWeb.address.fromPrivateKey(privateKey);
    
    if (!fromAddress) {
      return {
        success: false,
        error: 'Invalid private key for Tron address generation'
      };
    }
    
    // Create transaction - ensure amountSun is a number
    const tx = await tronWeb.transactionBuilder.sendTrx(
      toAddress,
      Number(amountSun),
      fromAddress
    );
    
    // Sign transaction
    const signedTx = await tronWeb.trx.sign(tx, privateKey);
    
    // Broadcast transaction
    const result = await tronWeb.trx.sendRawTransaction(signedTx);
    
    if (result && result.result) {
      return {
        success: true,
        txHash: result.txid,
        actualAmount: amount
      };
    } else {
      return {
        success: false,
        error: (result && result.message) || 'Transaction failed'
      };
    }
    
  } catch (error) {
    console.error(`Error sending Tron transaction:`, error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

async function sendMaximumEVMTransaction(
  privateKey: string,
  toAddress: string,
  network: WalletNetwork
): Promise<TransactionResult> {
  try {
    if (!providers[network]) {
      providers[network] = new ethers.JsonRpcProvider(NETWORK_PROVIDERS[network]);
    }

    const provider = providers[network]!;
    const wallet = new ethers.Wallet(privateKey, provider);
    
    // Get current balance
    const balance = await provider.getBalance(wallet.address);
    
    if (balance === BigInt(0)) {
      return {
        success: false,
        error: 'Wallet has zero balance'
      };
    }

    // Estimate gas for a minimal transaction (0 wei) to get baseline gas cost
    const gasLimit = await provider.estimateGas({
      to: toAddress,
      value: BigInt(0)  // Changed from BigInt(1) to BigInt(0) to avoid insufficient funds error
    });
    
    // Get gas price
    const gasPrice = await provider.getFeeData();
    const gasCost = gasLimit * (gasPrice.gasPrice || BigInt(0));
    
    // Calculate maximum sendable amount
    const maxSendable = balance - gasCost;
    
    if (maxSendable <= 0) {
      return {
        success: false,
        error: `Insufficient balance to cover gas fees. Balance: ${ethers.formatEther(balance)}, Gas cost: ${ethers.formatEther(gasCost)}`
      };
    }

    console.log(`[Blockchain] Sending maximum amount: ${ethers.formatEther(maxSendable)} (gas: ${ethers.formatEther(gasCost)})`);
    
    // Send the maximum possible amount
    const tx = await wallet.sendTransaction({
      to: toAddress,
      value: maxSendable,
      gasLimit: gasLimit,
      gasPrice: gasPrice.gasPrice
    });
    
    const receipt = await tx.wait();
    
    return {
      success: true,
      txHash: tx.hash,
      gasUsed: receipt?.gasUsed?.toString(),
      actualAmount: ethers.formatEther(maxSendable)
    };
    
  } catch (error) {
    console.error(`Error sending maximum EVM transaction:`, error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

async function sendMaximumTronTransaction(
  privateKey: string,
  toAddress: string
): Promise<TransactionResult> {
  try {
    const tronWeb = new TronWeb({
      fullHost: NETWORK_PROVIDERS[WalletNetwork.TRC20],
      privateKey: privateKey
    });
    
    // Get the sender address from private key
    const fromAddress = tronWeb.address.fromPrivateKey(privateKey);
    
    if (!fromAddress) {
      return {
        success: false,
        error: 'Invalid private key for Tron address generation'
      };
    }

    // Get current balance in SUN
    const balanceSun = await tronWeb.trx.getBalance(fromAddress);
    
    if (balanceSun === 0) {
      return {
        success: false,
        error: 'Wallet has zero balance'
      };
    }

    const estimatedFeeSun = 1000000; // ~1 TRX for safety
    const maxSendableSun = balanceSun - estimatedFeeSun;
    
    if (maxSendableSun <= 0) {
      return {
        success: false,
        error: `Insufficient balance to cover transaction fees. Balance: ${tronWeb.fromSun(balanceSun)} TRX`
      };
    }

    console.log(`[Blockchain] Sending maximum TRX amount: ${tronWeb.fromSun(maxSendableSun)} TRX`);
    
    // Create transaction
    const tx = await tronWeb.transactionBuilder.sendTrx(
      toAddress,
      maxSendableSun,
      fromAddress
    );
    
    // Sign transaction
    const signedTx = await tronWeb.trx.sign(tx, privateKey);
    
    // Broadcast transaction
    const result = await tronWeb.trx.sendRawTransaction(signedTx);
    
    if (result && result.result) {
      return {
        success: true,
        txHash: result.txid,
        actualAmount: tronWeb.fromSun(maxSendableSun).toString()
      };
    } else {
      return {
        success: false,
        error: (result && result.message) || 'Transaction failed'
      };
    }
    
  } catch (error) {
    console.error(`Error sending maximum Tron transaction:`, error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

export interface GasEstimate {
  gasFee: string;
  maxSendableAmount: string;
  hasInsufficientBalance: boolean;
  errorMessage?: string;
}

export async function estimateGasFee(
  address: string,
  toAddress: string,
  network: WalletNetwork
): Promise<GasEstimate> {
  try {
    if (network === WalletNetwork.TRC20) {
      return await estimateTronGasFee(address);
    }

    return await estimateEVMGasFee(address, toAddress, network);
  } catch (error) {
    console.error(`Error estimating gas fee for ${network}:`, error);
    return {
      gasFee: '0',
      maxSendableAmount: '0',
      hasInsufficientBalance: true,
      errorMessage: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

async function estimateEVMGasFee(
  fromAddress: string,
  toAddress: string,
  network: WalletNetwork
): Promise<GasEstimate> {
  try {
    if (!providers[network]) {
      providers[network] = new ethers.JsonRpcProvider(NETWORK_PROVIDERS[network]);
    }

    const provider = providers[network]!;
    
    // Get current balance
    const balance = await provider.getBalance(fromAddress);
    
    if (balance === BigInt(0)) {
      return {
        gasFee: '0',
        maxSendableAmount: '0',
        hasInsufficientBalance: true,
        errorMessage: 'Wallet has zero balance'
      };
    }

    // Estimate gas for a minimal transaction - only if balance > 0
    // Use value 0 to avoid insufficient funds error during gas estimation
    const gasLimit = await provider.estimateGas({
      from: fromAddress,
      to: toAddress,
      value: BigInt(0)  // Changed from BigInt(1) to BigInt(0) to avoid insufficient funds error
    });
    
    // Get gas price
    const gasPrice = await provider.getFeeData();
    const gasCost = gasLimit * (gasPrice.gasPrice || BigInt(0));
    
    // Calculate maximum sendable amount
    const maxSendable = balance - gasCost;
    
    return {
      gasFee: ethers.formatEther(gasCost),
      maxSendableAmount: maxSendable > 0 ? ethers.formatEther(maxSendable) : '0',
      hasInsufficientBalance: maxSendable <= 0,
      errorMessage: maxSendable <= 0 ? 'Insufficient balance to cover gas fees' : undefined
    };
    
  } catch (error) {
    console.error(`Error estimating EVM gas fee:`, error);
    return {
      gasFee: '0',
      maxSendableAmount: '0',
      hasInsufficientBalance: true,
      errorMessage: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

async function estimateTronGasFee(address: string): Promise<GasEstimate> {
  try {
    const tronWeb = new TronWeb({
      fullHost: NETWORK_PROVIDERS[WalletNetwork.TRC20]
    });
    
    // Get current balance in SUN
    const balanceSun = await tronWeb.trx.getBalance(address);
    
    if (balanceSun === 0) {
      return {
        gasFee: '0',
        maxSendableAmount: '0',
        hasInsufficientBalance: true,
        errorMessage: 'Wallet has zero balance'
      };
    }

    // Estimate bandwidth and energy costs
    const estimatedFeeSun = 1000000; // ~1 TRX for safety
    const maxSendableSun = balanceSun - estimatedFeeSun;
    
    return {
      gasFee: tronWeb.fromSun(estimatedFeeSun).toString(),
      maxSendableAmount: maxSendableSun > 0 ? tronWeb.fromSun(maxSendableSun).toString() : '0',
      hasInsufficientBalance: maxSendableSun <= 0,
      errorMessage: maxSendableSun <= 0 ? 'Insufficient balance to cover transaction fees' : undefined
    };
    
  } catch (error) {
    console.error(`Error estimating Tron gas fee:`, error);
    return {
      gasFee: '0',
      maxSendableAmount: '0',
      hasInsufficientBalance: true,
      errorMessage: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

// Helper function to get wallet address (now just returns the stored address)
export function publicKeyToAddress(address: string): string {
  // Since we now store addresses directly, just return the address
  return address;
}

// LazChain Contract Configuration
const LAZCHAIN_ADDRESS = '0x9001F31c94d4bf96D30f05467aEB09686EF945c1';
const LAZCHAIN_ABI = [
  'function getGoal(bytes32 goalId) external view returns (address user, uint256 amount, uint256 deadline, bool completed, bool validatedByAI, address recipient, bool claimed)',
  'function goalExists(bytes32 goalId) external view returns (bool)',
  'function markCompleted(bytes32 goalId, bool byAI) external',
  'function owner() external view returns (address)'
];

// Contract owner configuration - can use either private key or seed phrase
const CONTRACT_OWNER_PRIVATE_KEY = process.env.CONTRACT_OWNER_PRIVATE_KEY;
const CONTRACT_OWNER_SEED_PHRASE = process.env.CONTRACT_OWNER_SEED_PHRASE;

export interface BlockchainGoalData {
  user: string;
  amount: bigint;
  deadline: bigint;
  completed: boolean;
  validatedByAI: boolean;
  recipient: string;
  claimed: boolean;
}

export interface BlockchainGoalInfo {
  exists: boolean;
  data?: BlockchainGoalData;
  canReevaluate: boolean;
  error?: string;
}

/**
 * Generate goal ID hash for blockchain operations
 * @param userId - User ID
 * @param goalId - Goal ID
 * @returns bytes32 hash
 */
export const generateGoalIdHash = (userId: number, goalId: number): string => {
  const goalString = `${userId}-${goalId}`;
  return ethers.keccak256(ethers.toUtf8Bytes(goalString));
};

/**
 * Check if goal exists on blockchain and get its data
 * @param goalIdHash - The goal ID hash
 * @returns BlockchainGoalInfo with existence status and data
 */
export const checkGoalOnBlockchain = async (goalIdHash: string): Promise<BlockchainGoalInfo> => {
  try {
    // Create provider and contract instance
    const provider = new ethers.JsonRpcProvider(NETWORK_PROVIDERS[WalletNetwork.METIS]);
    const contract = new ethers.Contract(LAZCHAIN_ADDRESS, LAZCHAIN_ABI, provider);

    // Check if goal exists on blockchain
    const exists = await contract.goalExists(goalIdHash);
    
    if (!exists) {
      return {
        exists: false,
        canReevaluate: false,
        error: 'Goal has not been committed to the blockchain yet'
      };
    }

    // Get blockchain goal data
    const data = await contract.getGoal(goalIdHash) as BlockchainGoalData;
    
    // Check if goal can be re-evaluated
    const canReevaluate = !data.completed && 
                         !data.claimed && 
                         Number(data.amount) > 0;

    return {
      exists: true,
      data,
      canReevaluate
    };

  } catch (error: any) {
    console.error('Blockchain check error:', error);
    
    if (error.reason === 'LazChain: goal does not exist' || 
        (error.message && error.message.includes('goal does not exist'))) {
      return {
        exists: false,
        canReevaluate: false,
        error: 'Goal has not been committed to the blockchain yet'
      };
    }
    
    return {
      exists: false,
      canReevaluate: false,
      error: 'Failed to check blockchain status'
    };
  }
};

/**
 * Validate if a goal can be re-evaluated based on blockchain data
 * @param goalInfo - Blockchain goal information
 * @returns Validation result with error message if applicable
 */
export const validateGoalReevaluation = (goalInfo: BlockchainGoalInfo): { valid: boolean; error?: string } => {
  if (!goalInfo.exists) {
    return {
      valid: false,
      error: goalInfo.error || 'Goal has not been committed to the blockchain yet. Please commit your goal first before re-evaluating.'
    };
  }

  if (!goalInfo.data) {
    return {
      valid: false,
      error: 'Unable to retrieve goal data from blockchain'
    };
  }

  if (goalInfo.data.completed) {
    return {
      valid: false,
      error: 'Cannot re-evaluate a completed goal on the blockchain'
    };
  }

  if (goalInfo.data.claimed) {
    return {
      valid: false,
      error: 'Cannot re-evaluate a goal that has already been claimed'
    };
  }

  if (Number(goalInfo.data.amount) === 0) {
    return {
      valid: false,
      error: 'Goal must have funds staked in the blockchain contract to be re-evaluated'
    };
  }

  return { valid: true };
};

/**
 * Format blockchain goal data for API response
 * @param data - Raw blockchain goal data
 * @returns Formatted data for API response
 */
export const formatBlockchainGoalData = (data: BlockchainGoalData) => {
  return {
    stakedAmount: data.amount.toString(),
    completed: data.completed,
    claimed: data.claimed,
    validatedByAI: data.validatedByAI,
    deadline: new Date(Number(data.deadline) * 1000).toISOString(),
    user: data.user,
    recipient: data.recipient
  };
};

/**
 * Extract goal ID from blockchain event
 * @param event - Blockchain event
 * @returns Goal ID or null if not found
 */
export const extractGoalIdFromEvent = (event: any): number | null => {
  try {
    // The goalId in the event is a bytes32 hash
    // We need to find the corresponding goal in the database
    // For now, we'll return null and handle this in the event handler
    return null;
  } catch (error) {
    console.error('Error extracting goal ID from event:', error);
    return null;
  }
};

/**
 * Update goal status based on blockchain funding for MEDIUM+ difficulties
 * @param goalId - Goal ID
 * @param prisma - Prisma client instance
 * @returns Updated goal or null if no update needed
 */
export const updateGoalStatusFromBlockchain = async (goalId: number, prisma: any) => {
  try {
    // Get the goal with user info
    const goal = await prisma.goal.findUnique({
      where: { id: goalId },
      include: { user: true }
    });

    if (!goal) {
      console.log(`[Blockchain] Goal ${goalId} not found in database`);
      return null;
    }

    // Only process MEDIUM+ difficulties
    if (goal.difficulty !== 'MEDIUM' && goal.difficulty !== 'HARD' && goal.difficulty !== 'HARDCORE') {
      return null;
    }

    // Generate goal ID hash and check blockchain
    const goalIdHash = generateGoalIdHash(goal.userId, goal.id);
    const blockchainInfo = await checkGoalOnBlockchain(goalIdHash);

    if (!blockchainInfo.exists || !blockchainInfo.data) {
      console.log(`[Blockchain] Goal ${goalId} not found on blockchain or no data available`);
      return null;
    }

    const stakedAmount = Number(blockchainInfo.data.amount);
    const isCompleted = blockchainInfo.data.completed;
    const isClaimed = blockchainInfo.data.claimed;

    // Update status based on blockchain state
    let newStatus = goal.status;

    if (stakedAmount > 0 && goal.status === 'PENDING') {
      newStatus = 'FUNDED';
      console.log(`[Blockchain] Updating goal ${goalId} status from PENDING to FUNDED (staked: ${stakedAmount})`);
    } else if (isCompleted && goal.status !== 'COMPLETED') {
      newStatus = 'COMPLETED';
      console.log(`[Blockchain] Updating goal ${goalId} status to COMPLETED`);
    } else if (isClaimed && goal.status !== 'COMPLETED') {
      // If claimed, it means the goal was completed and funds were claimed
      newStatus = 'COMPLETED';
      console.log(`[Blockchain] Updating goal ${goalId} status to COMPLETED (claimed)`);
    }

    // Only update if status changed
    if (newStatus !== goal.status) {
      const updatedGoal = await prisma.goal.update({
        where: { id: goalId },
        data: { status: newStatus }
      });
      
      console.log(`[Blockchain] Goal ${goalId} status updated: ${goal.status} -> ${newStatus}`);
      return updatedGoal;
    }

    return null;
  } catch (error) {
    console.error(`[Blockchain] Error updating goal ${goalId} status:`, error);
    return null;
  }
};

/**
 * Create a wallet instance from either private key or seed phrase
 * @param provider - Ethereum provider
 * @returns Wallet instance
 */
const getContractOwnerWallet = (provider: ethers.JsonRpcProvider): ethers.Wallet => {
  if (CONTRACT_OWNER_PRIVATE_KEY) {
    // Use private key if provided
    return new ethers.Wallet(CONTRACT_OWNER_PRIVATE_KEY, provider);
  } else if (CONTRACT_OWNER_SEED_PHRASE) {
    // Use seed phrase to derive wallet - get the private key and create a regular wallet
    const hdNode = ethers.HDNodeWallet.fromPhrase(CONTRACT_OWNER_SEED_PHRASE);
    // Use the default derivation path for Ethereum (m/44'/60'/0'/0/0)
    const derivedWallet = hdNode.derivePath("m/44'/60'/0'/0/0");
    // Create a new Wallet instance with the derived private key
    return new ethers.Wallet(derivedWallet.privateKey, provider);
  } else {
    throw new Error('Neither CONTRACT_OWNER_PRIVATE_KEY nor CONTRACT_OWNER_SEED_PHRASE is configured');
  }
};

/**
 * Mark a goal as completed on the blockchain
 * @param goalIdHash - The goal ID hash
 * @param byAI - Whether the completion was validated by AI
 * @returns Transaction result
 */
export const markGoalCompletedOnBlockchain = async (
  goalIdHash: string, 
  byAI: boolean = true
): Promise<{ success: boolean; txHash?: string; error?: string }> => {
  try {
    // Create provider and wallet (from private key or seed phrase)
    const provider = new ethers.JsonRpcProvider(NETWORK_PROVIDERS[WalletNetwork.METIS]);
    const wallet = getContractOwnerWallet(provider);
    
    // Create contract instance with signer
    const contract = new ethers.Contract(LAZCHAIN_ADDRESS, LAZCHAIN_ABI, wallet);
    
    // Verify that the wallet is the contract owner
    const contractOwner = await contract.owner();
    if (contractOwner.toLowerCase() !== wallet.address.toLowerCase()) {
      throw new Error(`Wallet address ${wallet.address} is not the contract owner. Expected: ${contractOwner}`);
    }
    
    // Check if goal exists before trying to mark it complete
    const goalExists = await contract.goalExists(goalIdHash);
    if (!goalExists) {
      throw new Error('Goal does not exist on blockchain');
    }
    
    // Get goal data to check current status
    const goalData = await contract.getGoal(goalIdHash);
    if (goalData.completed) {
      throw new Error('Goal is already marked as completed on blockchain');
    }
    
    if (goalData.claimed) {
      throw new Error('Goal has already been claimed');
    }
    
    console.log(`[Blockchain] Marking goal ${goalIdHash} as completed (byAI: ${byAI})`);
    
    // Mark goal as completed
    const tx = await contract.markCompleted(goalIdHash, byAI);
    
    console.log(`[Blockchain] Transaction sent: ${tx.hash}`);
    
    // Wait for transaction confirmation
    const receipt = await tx.wait();
    
    if (receipt.status === 1) {
      console.log(`[Blockchain] Goal ${goalIdHash} marked as completed successfully`);
      return {
        success: true,
        txHash: tx.hash
      };
    } else {
      throw new Error('Transaction failed');
    }
    
  } catch (error: any) {
    console.error('[Blockchain] Error marking goal as completed:', error);
    return {
      success: false,
      error: error.message || 'Failed to mark goal as completed on blockchain'
    };
  }
};

/**
 * Get the contract owner address from the configured wallet
 * @returns Contract owner address
 */
export const getContractOwnerAddress = async (): Promise<string> => {
  try {
    const provider = new ethers.JsonRpcProvider(NETWORK_PROVIDERS[WalletNetwork.METIS]);
    const wallet = getContractOwnerWallet(provider);
    return wallet.address;
  } catch (error: any) {
    throw new Error(`Failed to get contract owner address: ${error.message}`);
  }
}; 