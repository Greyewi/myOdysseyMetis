import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { GoalWithWallet } from '../../types/goals';
import { 
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  Alert,
  CircularProgress,
  Chip,
  Divider,
  useTheme,
  useMediaQuery,
  IconButton,
  Tooltip
} from '@mui/material';
import {
  AccountBalanceWallet as WalletIcon,
  CheckCircle as CheckCircleIcon,
  Schedule as ScheduleIcon,
  ContentCopy as CopyIcon,
  Refresh as RefreshIcon,
  Warning as WarningIcon,
  Info as InfoIcon,
  Cancel as CancelIcon,
  Add as AddIcon
} from '@mui/icons-material';
import { 
  getGoal, 
  generateGoalId, 
  weiToMetis, 
  metisToWei,
  markGoalCompleted, 
  claimGoal,
  commitGoal,
  getContract,
  waitForTransaction,
  getContractOwner
} from '../../utils/contract';
import { ethers } from 'ethers';
import { useWallet } from '../../hooks/useWallet';
import { config } from '../../config';

const TabContent = styled('div')<{ isMobile?: boolean }>`
  padding: ${({ isMobile }) => isMobile ? '16px' : '0'};
  margin-bottom: 16px;
  border-radius: 12px;
  
  @media (max-width: 768px) {
    padding: 12px;
    margin-bottom: 12px;
    border-radius: 8px;
  }
`;

const InfoItem = styled(Box)`
  display: flex;
  align-items: center;
  padding: 12px 0;
  border-bottom: 1px solid #f0f0f0;
  gap: 12px;
  
  @media (max-width: 768px) {
    flex-direction: column;
    align-items: flex-start;
    gap: 4px;
    padding: 8px 0;
  }
  
  &:last-child {
    border-bottom: none;
  }
`;

const ActionButton = styled(Button)`
  && {
    margin: 8px;
    min-width: 120px;
    
    @media (max-width: 768px) {
      min-width: 100px;
      font-size: 0.875rem;
    }
  }
`;

interface GoalContractProps {
  goal: GoalWithWallet;
  onGoalUpdate: () => void;
}

const GoalContract: React.FC<GoalContractProps> = ({ goal, onGoalUpdate }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const { isConnected, address } = useWallet();
  
  const [blockchainData, setBlockchainData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [isContractOwner, setIsContractOwner] = useState<boolean>(false);

  // Fetch blockchain data
  const fetchBlockchainData = async () => {
    if (goal.difficulty !== 'MEDIUM' && goal.difficulty !== 'HARD' && goal.difficulty !== 'HARDCORE') {
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      const goalId = generateGoalId(goal.userId.toString(), goal.id);
      const blockchainGoal = await getGoal(goalId);
      
      // Try to find additional funding commitments
      let totalAmount = Number(blockchainGoal.amount);
      let additionalCommitments = 0;
      
      // Check for additional funding commitments (up to 10 attempts)
      for (let i = 1; i <= 10; i++) {
        try {
          const additionalGoalId = generateGoalId(goal.userId.toString(), goal.id + i);
          const additionalGoal = await getGoal(additionalGoalId);
          if (additionalGoal && Number(additionalGoal.amount) > 0) {
            totalAmount += Number(additionalGoal.amount);
            additionalCommitments++;
          }
        } catch (error) {
          // Stop checking if goal doesn't exist
          break;
        }
      }
      
      // Create combined blockchain data
      const combinedData = {
        ...blockchainGoal,
        amount: totalAmount.toString(),
        originalAmount: blockchainGoal.amount,
        additionalCommitments: additionalCommitments
      };
      
      setBlockchainData(combinedData);
      
      // Check if current user is contract owner
      try {
        const contractOwner = await getContractOwner();
        const { address } = await getContract();
        setIsContractOwner(contractOwner.toLowerCase() === address.toLowerCase());
      } catch (error) {
        console.error('Error checking contract ownership:', error);
        setIsContractOwner(false);
      }
    } catch (error: any) {
      if (
        error.reason === 'LazChain: goal does not exist' ||
        (error.message && error.message.includes('goal does not exist'))
      ) {
        // This is expected for goals that haven't been committed yet
        setError(null); // Clear any previous errors
        setBlockchainData(null);
      } else {
        setError(error.message || 'Failed to fetch blockchain data');
        setBlockchainData(null);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBlockchainData();
  }, [goal.difficulty, goal.userId, goal.id]);

  // Handle contract actions
  const handleMarkCompleted = async () => {
    if (!isConnected) {
      setError('Please connect your wallet first');
      return;
    }

    setActionLoading('complete');
    setError(null);
    setSuccessMessage(null);
    
    try {
      // First, call the AI validation endpoint
      const token = localStorage.getItem('cryptogoals_auth_token');
      const aiValidationResponse = await fetch(`${config.apiUrl}/goals/${goal.id}/mark-complete`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      if (!aiValidationResponse.ok) {
        const errorData = await aiValidationResponse.json();
        
        // Handle rate limiting error
        if (aiValidationResponse.status === 429) {
          const rateLimitError = `⏰ Rate Limit Exceeded\n\n${errorData.error || errorData.message}`;
          if (errorData.nextAttemptAllowedAt) {
            const nextAttempt = new Date(errorData.nextAttemptAllowedAt);
            const formattedTime = nextAttempt.toLocaleString();
            setError(`${rateLimitError}\n\nNext attempt allowed: ${formattedTime}`);
          } else {
            setError(rateLimitError);
          }
          return;
        }
        
        // If AI validation fails, show detailed error
        if (aiValidationResponse.status === 400) {
          let detailedError = `AI Validation Failed: ${errorData.reason || errorData.message}`;
          
          // Add validation details if available
          if (errorData.validationDetails) {
            const details = errorData.validationDetails;
            detailedError += `\n\nValidation Details:`;
            detailedError += `\n• Total Tasks: ${details.totalTasks}`;
            detailedError += `\n• Completed Tasks: ${details.completedTasks}`;
            detailedError += `\n• Completion Rate: ${details.completionRate}`;
            detailedError += `\n• Has AI Evaluation: ${details.hasAIEvaluation ? 'Yes' : 'No'}`;
            detailedError += `\n• Achievability Score: ${details.achievabilityScore}/100`;
          }
          
          // Add suggestions if available
          if (errorData.suggestions && errorData.suggestions.length > 0) {
            detailedError += `\n\nSuggestions:`;
            errorData.suggestions.forEach((suggestion: string, index: number) => {
              detailedError += `\n${index + 1}. ${suggestion}`;
            });
          }
          
          setError(detailedError);
          return;
        }
        
        throw new Error(errorData.message || 'AI validation failed');
      }

      const aiValidationData = await aiValidationResponse.json();
      
      // Backend now handles both AI validation and blockchain transaction
      // Refresh blockchain data and goal data
      await fetchBlockchainData();
      onGoalUpdate(); // Refresh goal data
      
      setError(null);
      
      // Show success message with AI validation details and blockchain info
      let completionMessage = `Goal marked as complete successfully! AI validated with ${aiValidationData.aiValidation.confidence} confidence. Task completion: ${aiValidationData.completionStats.completionRate}`;
      
      if (aiValidationData.blockchain) {
        if (aiValidationData.blockchain.called) {
          if (aiValidationData.blockchain.success) {
            completionMessage += `\n\nBlockchain: Successfully marked complete (TX: ${aiValidationData.blockchain.txHash?.slice(0, 10)}...)`;
          } else {
            completionMessage += `\n\nBlockchain: Failed to mark complete (${aiValidationData.blockchain.error})`;
          }
        } else {
          completionMessage += `\n\nBlockchain: ${aiValidationData.blockchain.reason}`;
        }
      }
      
      setSuccessMessage(completionMessage);
      
    } catch (error: any) {
      setError(error.message || 'Failed to mark goal as completed');
    } finally {
      setActionLoading(null);
    }
  };

     const handleClaim = async () => {
    if (!isConnected) {
      setError('Please connect your wallet first');
      return;
    }

    setActionLoading('claim');
    setError(null);
    setSuccessMessage(null);
    
    try {
      const goalId = generateGoalId(goal.userId.toString(), goal.id);
      const tx = await claimGoal(goalId);
     
     // Refresh blockchain data
     await fetchBlockchainData();
     onGoalUpdate(); // Refresh goal data
     
     setError(null);
   } catch (error: any) {
     setError(error.message || 'Failed to claim goal');
   } finally {
     setActionLoading(null);
   }
 };

  const handleFailGoal = async () => {
    if (!isConnected) {
      setError('Please connect your wallet first');
      return;
    }

    setActionLoading('fail');
    setError(null);
    setSuccessMessage(null);
    
    try {
      // Note: The smart contract doesn't have a direct "fail goal" function
      // The contract only allows marking as completed or claiming after deadline
      // For immediate failure, we need to use the backend to update the goal status
      // This is a limitation of the current contract design
      const response = await fetch(`${config.apiUrl}/goals/${goal.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('cryptogoals_auth_token')}`
        },
        body: JSON.stringify({ status: 'FAILED' })
      });

      if (!response.ok) {
        throw new Error('Failed to mark goal as failed');
      }
      
      // Refresh blockchain data
      await fetchBlockchainData();
      onGoalUpdate(); // Refresh goal data
      
      setError(null);
    } catch (error: any) {
      setError(error.message || 'Failed to mark goal as failed');
    } finally {
      setActionLoading(null);
    }
  };

  const handleFundGoal = async () => {
    if (!isConnected) {
      setError('Please connect your wallet first');
      return;
    }

    setActionLoading('fund');
    setError(null);
    setSuccessMessage(null);
    
    try {
      // For additional funding, we need to create a new goal ID
      // This is a limitation of the current contract design
      const newGoalId = generateGoalId(goal.userId.toString(), goal.id + Date.now());
      const deadline = Math.floor(new Date(goal.deadline).getTime() / 1000);
      const amountInMetis = '0.001'; // Additional funding amount
      const amountInWei = metisToWei(amountInMetis);
      const { address } = await getContract();
      const recipient = address;
      
      const tx = await commitGoal(newGoalId, deadline, recipient, amountInWei);
      
      // Refresh blockchain data
      await fetchBlockchainData();
      onGoalUpdate(); // Refresh goal data
      
      setError(null);
    } catch (error: any) {
      setError(error.message || 'Failed to fund goal');
    } finally {
      setActionLoading(null);
    }
  };

  const handleCommitGoal = async () => {
    if (!isConnected) {
      setError('Please connect your wallet first');
      return;
    }

    setActionLoading('commit');
    setError(null);
    setSuccessMessage(null);
    
    try {
      const goalId = generateGoalId(goal.userId.toString(), goal.id);
      const deadline = Math.floor(new Date(goal.deadline).getTime() / 1000);
      const amountInMetis = '0.001'; // Default amount, could be made configurable
      const amountInWei = metisToWei(amountInMetis);
      const { address } = await getContract();
      const recipient = address;
      
      const tx = await commitGoal(goalId, deadline, recipient, amountInWei);
      
      // Refresh blockchain data
      await fetchBlockchainData();
      onGoalUpdate(); // Refresh goal data
      
      setError(null);
    } catch (error: any) {
      setError(error.message || 'Failed to commit goal to blockchain');
    } finally {
      setActionLoading(null);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const canMarkCompleted = blockchainData && 
    blockchainData.completed !== undefined &&
    blockchainData.claimed !== undefined &&
    blockchainData.amount !== undefined &&
    !blockchainData.completed && 
    !blockchainData.claimed && 
    Number(blockchainData.amount) > 0 &&
    isContractOwner; // Only contract owner can mark as completed

  const canClaim = blockchainData && 
    blockchainData.deadline !== undefined &&
    blockchainData.claimed !== undefined &&
    blockchainData.amount !== undefined &&
    Math.floor(Date.now() / 1000) > Number(blockchainData.deadline) && 
    !blockchainData.claimed && 
    Number(blockchainData.amount) > 0;

  const canFailGoal = blockchainData && 
    blockchainData.completed !== undefined &&
    blockchainData.claimed !== undefined &&
    !blockchainData.completed && 
    !blockchainData.claimed;

  const canFundGoal = blockchainData && 
    !blockchainData.completed && 
    !blockchainData.claimed;

  const isGoalOwner = blockchainData && 
    blockchainData.user && 
    address && 
    blockchainData.user.toLowerCase() === address.toLowerCase();
  return (
    <TabContent isMobile={isMobile}>
      <Box display="flex" alignItems="center" gap={2} mb={3} flexWrap="wrap">
        <Typography 
          variant={isMobile ? "h5" : "h4"} 
          component="h1" 
          fontWeight="bold"
          sx={{ flex: 1, minWidth: '200px' }}
        >
          Contract Management
        </Typography>
        <IconButton onClick={fetchBlockchainData} disabled={loading}>
          <RefreshIcon />
        </IconButton>
      </Box>

      {!isConnected && (
        <Alert severity="warning" sx={{ mb: 3 }}>
          Please connect your wallet to interact with the smart contract.
        </Alert>
      )}

      {error && !error.includes('AI Validation Failed') && (
        <Alert severity="warning" sx={{ mb: 3 }}>
          <Box>
            <Typography variant="body2" fontWeight="600" mb={1}>
              {error}
            </Typography>
            {error.includes('not yet been committed') && (
              <Box>
                <Typography variant="body2" color="text.secondary" mb={2}>
                  You can commit this goal to the blockchain directly from this tab, or go to the Goal Information tab and select a difficulty level of MEDIUM or higher.
                </Typography>
                <Button 
                  variant="contained" 
                  color="primary"
                  size="small"
                  onClick={handleCommitGoal}
                  disabled={!isConnected || actionLoading !== null}
                  startIcon={actionLoading === 'commit' ? <CircularProgress size={14} /> : <WalletIcon />}
                >
                  {actionLoading === 'commit' ? 'Committing...' : 'Commit Goal Now'}
                </Button>
              </Box>
            )}
          </Box>
        </Alert>
      )}

      {successMessage && (
        <Alert severity="success" sx={{ mb: 3 }} onClose={() => setSuccessMessage(null)}>
          <Typography variant="body2" fontWeight="600">
            {successMessage}
          </Typography>
        </Alert>
      )}

      {loading && (
        <Box display="flex" justifyContent="center" p={3}>
          <CircularProgress />
        </Box>
      )}

      {!loading && !blockchainData && !error && (
        <Card variant="outlined" sx={{ mb: 3 }}>
          <CardContent>
            <Box display="flex" flexDirection="column" alignItems="center" textAlign="center" py={4}>
              <WalletIcon color="action" sx={{ fontSize: 48, mb: 2 }} />
              <Typography variant="h6" fontWeight="600" mb={1}>
                Goal Not Committed to Blockchain
              </Typography>
              <Typography variant="body2" color="text.secondary" mb={3}>
                This goal needs to be committed to the blockchain before you can manage it here.
              </Typography>
              <Box display="flex" gap={2} flexWrap="wrap" justifyContent="center">
                <Button 
                  variant="contained" 
                  color="primary"
                  onClick={handleCommitGoal}
                  disabled={!isConnected || actionLoading !== null}
                  startIcon={actionLoading === 'commit' ? <CircularProgress size={16} /> : <WalletIcon />}
                >
                  {actionLoading === 'commit' ? 'Committing...' : 'Commit Goal to Blockchain'}
                </Button>
                <Button 
                  variant="outlined" 
                  color="primary"
                  onClick={() => window.location.reload()}
                >
                  Refresh Page
                </Button>
              </Box>
            </Box>
          </CardContent>
        </Card>
      )}

      {blockchainData && (
        <>
          {/* Contract Status Card */}
          <Card variant="outlined" sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" fontWeight="600" mb={2} display="flex" alignItems="center" gap={1}>
                <WalletIcon color="primary" />
                Contract Status
              </Typography>
              
                             <Box display="flex" flexDirection={{ xs: 'column', md: 'row' }} gap={2}>
                 <Box flex={1}>
                   <InfoItem>
                     <Typography variant="body2" fontWeight="600" color="text.secondary">Status</Typography>
                     <Chip 
                       label={blockchainData.completed !== undefined ? (blockchainData.completed ? 'Completed' : 'Active') : 'Unknown'} 
                       color={blockchainData.completed ? 'success' : 'primary'}
                       size="small"
                     />
                   </InfoItem>
                   
                   <InfoItem>
                     <Typography variant="body2" fontWeight="600" color="text.secondary">Staked Amount</Typography>
                     <Typography variant="body2" fontWeight="500" color="primary">
                       {blockchainData.amount ? `${weiToMetis(blockchainData.amount.toString())} METIS` : 'N/A'}
                       {blockchainData.additionalCommitments > 0 && (
                         <Typography variant="caption" color="text.secondary" display="block">
                           (Original: {weiToMetis(blockchainData.originalAmount)} + {blockchainData.additionalCommitments} additional funding{blockchainData.additionalCommitments > 1 ? 's' : ''})
                         </Typography>
                       )}
                     </Typography>
                   </InfoItem>
                   
                   <InfoItem>
                     <Typography variant="body2" fontWeight="600" color="text.secondary">AI Validated</Typography>
                     <Box display="flex" alignItems="center" gap={1}>
                       {blockchainData.validatedByAI !== undefined ? (
                         blockchainData.validatedByAI ? (
                           <CheckCircleIcon color="success" fontSize="small" />
                         ) : (
                           <ScheduleIcon color="action" fontSize="small" />
                         )
                       ) : (
                         <ScheduleIcon color="action" fontSize="small" />
                       )}
                       <Typography variant="body2" fontWeight="500">
                         {blockchainData.validatedByAI !== undefined ? (blockchainData.validatedByAI ? 'Yes' : 'No') : 'Unknown'}
                       </Typography>
                     </Box>
                   </InfoItem>
                 </Box>
                 
                 <Box flex={1}>
                   <InfoItem>
                     <Typography variant="body2" fontWeight="600" color="text.secondary">Claimed</Typography>
                     <Chip 
                       label={blockchainData.claimed !== undefined ? (blockchainData.claimed ? 'Yes' : 'No') : 'Unknown'} 
                       color={blockchainData.claimed ? 'success' : 'default'}
                       size="small"
                     />
                   </InfoItem>
                   
                   <InfoItem>
                     <Typography variant="body2" fontWeight="600" color="text.secondary">Deadline</Typography>
                     <Typography variant="body2" fontWeight="500">
                       {blockchainData.deadline ? new Date(Number(blockchainData.deadline) * 1000).toLocaleDateString() : 'N/A'}
                     </Typography>
                   </InfoItem>
                   
                   <InfoItem>
                     <Typography variant="body2" fontWeight="600" color="text.secondary">Goal ID</Typography>
                     <Box display="flex" alignItems="center" gap={1}>
                       <Typography variant="body2" fontWeight="500" fontFamily="monospace" sx={{ fontSize: '0.75rem' }}>
                         {generateGoalId(goal.userId.toString(), goal.id).slice(0, 10)}...
                       </Typography>
                       <Tooltip title="Copy Goal ID">
                         <IconButton 
                           size="small" 
                           onClick={() => copyToClipboard(generateGoalId(goal.userId.toString(), goal.id))}
                         >
                           <CopyIcon fontSize="small" />
                         </IconButton>
                       </Tooltip>
                     </Box>
                   </InfoItem>
                 </Box>
               </Box>
            </CardContent>
          </Card>

          {/* Contract Actions Card */}
          <Card variant="outlined" sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" fontWeight="600" mb={2} display="flex" alignItems="center" gap={1}>
                <InfoIcon color="primary" />
                Contract Actions
              </Typography>
              
              <Alert severity="info" sx={{ mb: 2 }}>
                <Typography variant="body2">
                  <strong>Note:</strong> Additional funding is not supported by the current contract design. 
                  Each goal can only have one initial commitment. To add more funds, you would need to create a new goal commitment.
                </Typography>
              </Alert>
              
              <Alert severity="warning" sx={{ mb: 2 }}>
                <Typography variant="body2">
                  <strong>Important:</strong> "AI Mark Complete" validates goal completion using AI before marking as complete on the blockchain. 
                  This can only be called by the contract owner. "Fail Goal" uses the backend API.
                </Typography>
              </Alert>

              {/* AI Validation Results */}
              {error && (error.includes('AI Validation Failed') || error.includes('Rate Limit Exceeded')) && (
                <Alert severity={error.includes('Rate Limit Exceeded') ? 'warning' : 'info'} sx={{ mb: 2 }}>
                  <Box>
                    <Typography 
                      variant="body2" 
                      fontWeight="600" 
                      mb={1}
                      sx={{ 
                        whiteSpace: 'pre-line',
                        fontFamily: error.includes('•') || error.includes('1.') ? 'inherit' : 'inherit'
                      }}
                    >
                      {error}
                    </Typography>
                    {error.includes('AI Validation Failed') && (
                      <Box mt={2}>
                        <Typography variant="body2" color="text.secondary" mb={1}>
                          🤖 The AI has analyzed your goal and provided specific recommendations above. 
                          Address these suggestions to improve your goal completion chances.
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          📝 Tip: Go to the Goal Information tab to add tasks, update your progress, or get an AI re-evaluation.
                        </Typography>
                      </Box>
                    )}
                    {error.includes('Rate Limit Exceeded') && (
                      <Box mt={2}>
                        <Typography variant="body2" color="text.secondary">
                          ⚡ This limitation helps ensure thoughtful goal completion and prevents abuse of AI resources.
                        </Typography>
                      </Box>
                    )}
                  </Box>
                </Alert>
              )}
              
              {!isGoalOwner && !isContractOwner && (
                <Alert severity="info" sx={{ mb: 2 }}>
                  Only the goal creator or contract owner can perform contract actions.
                </Alert>
              )}
              
              {!isContractOwner && (
                <Alert severity="warning" sx={{ mb: 2 }}>
                  Only the contract owner can mark goals as completed. You can still fail goals and claim funds.
                </Alert>
              )}
              
              <Box display="flex" flexWrap="wrap" gap={2}>
                <Tooltip title="AI will validate goal completion before marking as complete">
                  <ActionButton
                    variant="contained"
                    color="success"
                    onClick={handleMarkCompleted}
                    disabled={!isConnected || !isContractOwner || !canMarkCompleted || actionLoading !== null}
                    startIcon={actionLoading === 'complete' ? <CircularProgress size={16} /> : <CheckCircleIcon />}
                  >
                    {actionLoading === 'complete' ? 'AI Validating...' : 'AI Mark Complete'}
                  </ActionButton>
                </Tooltip>
                
                <ActionButton
                  variant="contained"
                  color="error"
                  onClick={handleFailGoal}
                  disabled={!isConnected || !isGoalOwner || !canFailGoal || actionLoading !== null}
                  startIcon={actionLoading === 'fail' ? <CircularProgress size={16} /> : <CancelIcon />}
                >
                  {actionLoading === 'fail' ? 'Processing...' : 'Fail Goal'}
                </ActionButton>
                

                
                <ActionButton
                  variant="contained"
                  color="primary"
                  onClick={handleClaim}
                  disabled={!isConnected || !isGoalOwner || !canClaim || actionLoading !== null}
                  startIcon={actionLoading === 'claim' ? <CircularProgress size={16} /> : <WalletIcon />}
                >
                  {actionLoading === 'claim' ? 'Processing...' : 'Claim Funds'}
                </ActionButton>
              </Box>
              
              {!canMarkCompleted && !canClaim && !canFailGoal && (
                <Alert severity="warning" sx={{ mt: 2 }}>
                  <Typography variant="body2">
                    {blockchainData.completed 
                      ? 'Goal is already completed.' 
                      : blockchainData.claimed 
                        ? 'Funds have already been claimed.' 
                        : !isContractOwner
                          ? 'Only the contract owner can mark goals as completed.'
                          : 'No actions available for this goal.'}
                  </Typography>
                </Alert>
              )}
            </CardContent>
          </Card>

          {/* Contract Addresses Card */}
          <Card variant="outlined">
            <CardContent>
              <Typography variant="h6" fontWeight="600" mb={2} display="flex" alignItems="center" gap={1}>
                <WalletIcon color="primary" />
                Contract Addresses
              </Typography>
              
                                 <InfoItem>
                     <Typography variant="body2" fontWeight="600" color="text.secondary">Goal Creator</Typography>
                     <Box display="flex" alignItems="center" gap={1}>
                       <Typography variant="body2" fontWeight="500" fontFamily="monospace" sx={{ fontSize: '0.75rem' }}>
                         {blockchainData.user ? `${blockchainData.user.slice(0, 10)}...${blockchainData.user.slice(-8)}` : 'N/A'}
                       </Typography>
                       {blockchainData.user && (
                         <Tooltip title="Copy Address">
                           <IconButton size="small" onClick={() => copyToClipboard(blockchainData.user)}>
                             <CopyIcon fontSize="small" />
                           </IconButton>
                         </Tooltip>
                       )}
                     </Box>
                   </InfoItem>
                   
                   <InfoItem>
                     <Typography variant="body2" fontWeight="600" color="text.secondary">Recipient</Typography>
                     <Box display="flex" alignItems="center" gap={1}>
                       <Typography variant="body2" fontWeight="500" fontFamily="monospace" sx={{ fontSize: '0.75rem' }}>
                         {blockchainData.recipient ? `${blockchainData.recipient.slice(0, 10)}...${blockchainData.recipient.slice(-8)}` : 'N/A'}
                       </Typography>
                       {blockchainData.recipient && (
                         <Tooltip title="Copy Address">
                           <IconButton size="small" onClick={() => copyToClipboard(blockchainData.recipient)}>
                             <CopyIcon fontSize="small" />
                           </IconButton>
                         </Tooltip>
                       )}
                     </Box>
                   </InfoItem>
            </CardContent>
          </Card>
        </>
      )}
    </TabContent>
  );
};

export default GoalContract;
