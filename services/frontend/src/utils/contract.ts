import { ethers } from 'ethers';

// Contract configuration
export const LAZCHAIN_ADDRESS = '0x9001F31c94d4bf96D30f05467aEB09686EF945c1';
export const METIS_RPC = 'https://hyperion-testnet.metisdevops.link';

// Contract ABI (simplified for frontend)
export const LAZCHAIN_ABI = [
  'function commitGoal(bytes32 goalId, uint256 deadline, address recipient) external payable',
  'function markCompleted(bytes32 goalId, bool byAI) external',
  'function claim(bytes32 goalId) external',
  'function transferOwnership(address newOwner) external',
  'function getGoal(bytes32 goalId) external view returns (address user, uint256 amount, uint256 deadline, bool completed, bool validatedByAI, address recipient, bool claimed)',
  'function goalExists(bytes32 goalId) external view returns (bool)',
  'function owner() external view returns (address)',
  'event GoalCommitted(bytes32 indexed goalId, address indexed user, uint256 amount, uint256 deadline, address recipient)',
  'event GoalCompleted(bytes32 indexed goalId, bool byAI)',
  'event GoalClaimed(bytes32 indexed goalId, address indexed claimant, uint256 amount, bool successful)',
  'event OwnershipTransferred(address indexed previousOwner, address indexed newOwner)',
] as const;

// Utility functions
export const metisToWei = (amount: string): string => {
  return ethers.parseEther(amount).toString();
};

export const weiToMetis = (amount: string): string => {
  return ethers.formatEther(amount);
};

export const generateGoalId = (userId: string, goalId: number): string => {
  const goalString = `${userId}-${goalId}`;
  return ethers.keccak256(ethers.toUtf8Bytes(goalString));
};

// Mobile wallet detection
export const isMobileDevice = (): boolean => {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
};

// Get provider based on device type
export const getProvider = async (): Promise<ethers.BrowserProvider> => {
  if (typeof window === 'undefined') {
    throw new Error('Window is not defined');
  }

  // Check if MetaMask is available
  if (window.ethereum) {
    return new ethers.BrowserProvider(window.ethereum as any);
  }

  // For mobile devices, suggest WalletConnect
  if (isMobileDevice()) {
    throw new Error('No wallet detected. Please install MetaMask or use WalletConnect.');
  }

  throw new Error('No wallet detected. Please install MetaMask.');
};

// Contract interaction functions
export const getContract = async (): Promise<{ contract: ethers.Contract; signer: ethers.JsonRpcSigner; address: string }> => {
  const provider = await getProvider();
  const signer = await provider.getSigner();
  const address = await signer.getAddress();
  
  const contract = new ethers.Contract(LAZCHAIN_ADDRESS, LAZCHAIN_ABI, signer);
  
  return { contract, signer, address };
};

export const commitGoal = async (
  goalId: string,
  deadline: number,
  recipient: string,
  amount: string
): Promise<{ hash: string }> => {
  try {
    const { contract } = await getContract();
    
    const tx = await contract.commitGoal(goalId, deadline, recipient, {
      value: amount
    });
    
    console.log('Goal committed! Transaction hash:', tx.hash);
    return { hash: tx.hash };
  } catch (error) {
    console.error('Error committing goal:', error);
    throw error;
  }
};

export const markGoalCompleted = async (goalId: string, byAI: boolean = false): Promise<{ hash: string }> => {
  try {
    const { contract } = await getContract();
    
    const tx = await contract.markCompleted(goalId, byAI);
    
    console.log('Goal marked as completed! Transaction hash:', tx.hash);
    return { hash: tx.hash };
  } catch (error) {
    console.error('Error marking goal as completed:', error);
    throw error;
  }
};

export const claimGoal = async (goalId: string): Promise<{ hash: string }> => {
  try {
    const { contract } = await getContract();
    
    const tx = await contract.claim(goalId);
    
    console.log('Goal claimed! Transaction hash:', tx.hash);
    return { hash: tx.hash };
  } catch (error) {
    console.error('Error claiming goal:', error);
    throw error;
  }
};

export const transferOwnership = async (newOwner: string): Promise<{ hash: string }> => {
  try {
    const { contract } = await getContract();
    
    const tx = await contract.transferOwnership(newOwner);
    
    console.log('Ownership transferred! Transaction hash:', tx.hash);
    return { hash: tx.hash };
  } catch (error) {
    console.error('Error transferring ownership:', error);
    throw error;
  }
};

// Read functions
export const getGoal = async (goalId: string) => {
  try {
    const provider = new ethers.JsonRpcProvider(METIS_RPC);
    const contract = new ethers.Contract(LAZCHAIN_ADDRESS, LAZCHAIN_ABI, provider);
    
    const result = await contract.getGoal(goalId);
    
    // Map the array result to an object with named properties
    // Based on the getGoal function signature in LazChain.sol:
    // function getGoal(bytes32 goalId) external view returns (
    //   address user, uint256 amount, uint256 deadline, bool completed, 
    //   bool validatedByAI, address recipient, bool claimed
    // )
    return {
      user: result[0],
      amount: result[1],
      deadline: result[2],
      completed: result[3],
      validatedByAI: result[4],
      recipient: result[5],
      claimed: result[6]
    };
  } catch (error) {
    console.error('Error getting goal:', error);
    throw error;
  }
};

export const getContractBalance = async (): Promise<string> => {
  try {
    const provider = new ethers.JsonRpcProvider(METIS_RPC);
    const balance = await provider.getBalance(LAZCHAIN_ADDRESS);
    return weiToMetis(balance.toString());
  } catch (error) {
    console.error('Error getting contract balance:', error);
    throw error;
  }
};

export const getContractOwner = async (): Promise<string> => {
  try {
    const provider = new ethers.JsonRpcProvider(METIS_RPC);
    const contract = new ethers.Contract(LAZCHAIN_ADDRESS, LAZCHAIN_ABI, provider);
    
    const result = await contract.owner();
    return result as string;
  } catch (error) {
    console.error('Error getting contract owner:', error);
    throw error;
  }
};

export const goalExists = async (goalId: string): Promise<boolean> => {
  try {
    const provider = new ethers.JsonRpcProvider(METIS_RPC);
    const contract = new ethers.Contract(LAZCHAIN_ADDRESS, LAZCHAIN_ABI, provider);
    
    const result = await contract.goalExists(goalId);
    return result as boolean;
  } catch (error) {
    console.error('Error checking if goal exists:', error);
    throw error;
  }
};

// Transaction utilities
export const waitForTransaction = async (hash: string, confirmations: number = 1) => {
  try {
    const provider = new ethers.JsonRpcProvider(METIS_RPC);
    const receipt = await provider.waitForTransaction(hash, confirmations);
    
    if (!receipt) {
      throw new Error('Transaction receipt is null');
    }
    
    return receipt;
  } catch (error) {
    console.error('Error waiting for transaction:', error);
    throw error;
  }
};

export const getTransactionStatus = async (hash: string) => {
  try {
    const provider = new ethers.JsonRpcProvider(METIS_RPC);
    const receipt = await provider.getTransactionReceipt(hash);
    
    return receipt?.status === 1 ? 'success' : 'failed';
  } catch (error) {
    console.error('Error getting transaction status:', error);
    return 'pending';
  }
};

// Event listeners
export const onGoalCommitted = (callback: (event: any) => void) => {
  const provider = new ethers.JsonRpcProvider(METIS_RPC);
  const contract = new ethers.Contract(LAZCHAIN_ADDRESS, LAZCHAIN_ABI, provider);
  
  return contract.on('GoalCommitted', callback);
};

export const onGoalCompleted = (callback: (event: any) => void) => {
  const provider = new ethers.JsonRpcProvider(METIS_RPC);
  const contract = new ethers.Contract(LAZCHAIN_ADDRESS, LAZCHAIN_ABI, provider);
  
  return contract.on('GoalCompleted', callback);
};

export const onGoalClaimed = (callback: (event: any) => void) => {
  const provider = new ethers.JsonRpcProvider(METIS_RPC);
  const contract = new ethers.Contract(LAZCHAIN_ADDRESS, LAZCHAIN_ABI, provider);
  
  return contract.on('GoalClaimed', callback);
};

export const onOwnershipTransferred = (callback: (event: any) => void) => {
  const provider = new ethers.JsonRpcProvider(METIS_RPC);
  const contract = new ethers.Contract(LAZCHAIN_ADDRESS, LAZCHAIN_ABI, provider);
  
  return contract.on('OwnershipTransferred', callback);
};

// Error parsing
export const parseContractError = (error: any): string => {
  if (error.message?.includes('insufficient funds')) {
    return 'Insufficient funds in wallet';
  }
  if (error.message?.includes('user rejected')) {
    return 'Transaction was rejected by user';
  }
  if (error.message?.includes('network')) {
    return 'Network error. Please check your connection';
  }
  if (error.message?.includes('goal already exists')) {
    return 'Goal already exists on blockchain';
  }
  if (error.message?.includes('goal not found')) {
    return 'Goal not found on blockchain';
  }
  if (error.message?.includes('not authorized')) {
    return 'You are not authorized to perform this action';
  }
  if (error.message?.includes('deadline passed')) {
    return 'Goal deadline has passed';
  }
  if (error.message?.includes('goal not completed')) {
    return 'Goal must be completed before claiming';
  }
  if (error.message?.includes('goal already claimed')) {
    return 'Goal has already been claimed';
  }
  
  return error.message || 'An unexpected error occurred';
};

// Mobile wallet connection helper
export const connectMobileWallet = async (): Promise<ethers.BrowserProvider> => {
  if (!isMobileDevice()) {
    throw new Error('This function is only for mobile devices');
  }

  // For mobile, we can use WalletConnect or other mobile wallets
  // This is a placeholder - you would implement the actual mobile wallet connection
  // based on your preferred mobile wallet solution
  
  if (window.ethereum) {
    return new ethers.BrowserProvider(window.ethereum as any);
  }
  
  throw new Error('No mobile wallet detected. Please install a compatible wallet app.');
};
