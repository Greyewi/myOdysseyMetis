import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { GoalStatus, GoalWithWallet } from '../../types/goals';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { config } from '../../config';
import { 
  Button as MuiButton,
  Box,
  Typography,
  Chip,
  useTheme,
  useMediaQuery,
  Card,
  CardContent,
  Alert,
  CircularProgress,
  Divider
} from '@mui/material';
import {
  Share as ShareIcon,
  Edit as EditIcon,
  AccountBalanceWallet as WalletIcon,
  CheckCircle as CheckCircleIcon,
  Schedule as ScheduleIcon,
  TrendingUp as TrendingUpIcon
} from '@mui/icons-material';
import ConfirmationDialog from '../../components/ConfirmationDialog';
import { getGoal, generateGoalId, weiToMetis } from '../../utils/contract';

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

const ImageContainer = styled.div`
  margin: 1rem 0;
  display: flex;
  justify-content: center;
`;

const GoalImage = styled.img`
  max-width: 100%;
  max-height: 300px;
  border-radius: 12px;
  object-fit: contain;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  
  @media (max-width: 768px) {
    max-height: 200px;
    border-radius: 8px;
  }
`;

const StatusBadge = styled(Chip)<{ status: GoalStatus }>`
  && {
    background-color: ${props => {
      switch (props.status) {
        case GoalStatus.PENDING:
          return '#9e9e9e';
        case GoalStatus.FUNDED:
          return '#ff9800';
        case GoalStatus.ACTIVE:
          return '#2196F3';
        case GoalStatus.COMPLETED:
          return '#4CAF50';
        case GoalStatus.FAILED:
          return '#f44336';
        default:
          return '#2196F3';
      }
    }};
    color: white;
    font-weight: 600;
    font-size: 0.875rem;
    
    @media (max-width: 768px) {
      font-size: 0.75rem;
    }
  }
`;

const DifficultyBadge = styled(Chip)<{ difficulty: string }>`
  && {
    background-color: ${props => {
      switch (props.difficulty) {
        case 'EASY':
          return '#4CAF50';
        case 'MEDIUM':
          return '#FF9800';
        case 'HARD':
          return '#F44336';
        case 'HARDCORE':
          return '#9C27B0';
        case 'UNSET':
          return '#9E9E9E';
        default:
          return '#9E9E9E';
      }
    }};
    color: white;
    font-weight: 600;
    font-size: 0.875rem;
    
    .MuiChip-icon {
      color: white !important;
    }
    
    .MuiChip-iconColorPrimary {
      color: white !important;
    }
    
    @media (max-width: 768px) {
      font-size: 0.75rem;
    }
  }
`;

const ButtonGroup = styled(Box)`
  display: flex;
  gap: 12px;
  margin: 24px 0;
  flex-wrap: wrap;
  
  @media (max-width: 768px) {
    gap: 8px;
    margin-top: 16px;
  }
`;

const StatusButton = styled(MuiButton)<{ goalstatus: GoalStatus; difficulty?: string }>`
  && {
    background-color: ${props => {
      // For MEDIUM+ difficulties, FUNDED status should look like ACTIVE (blue)
      if (props.goalstatus === GoalStatus.FUNDED && 
          (props.difficulty === 'MEDIUM' || props.difficulty === 'HARD' || props.difficulty === 'HARDCORE')) {
        return '#2196F3';
      }
      
      switch (props.goalstatus) {
        case GoalStatus.PENDING:
          return '#9e9e9e';
        case GoalStatus.FUNDED:
          return '#ff9800';
        case GoalStatus.ACTIVE:
          return 'transparent';
        case GoalStatus.COMPLETED:
          return '#4CAF50';
        case GoalStatus.FAILED:
          return '#f44336';
        default:
          return '#2196F3';
      }
    }};
    color: ${props => {
      // For MEDIUM+ difficulties, FUNDED status should have white text
      if (props.goalstatus === GoalStatus.FUNDED && 
          (props.difficulty === 'MEDIUM' || props.difficulty === 'HARD' || props.difficulty === 'HARDCORE')) {
        return 'white';
      }
      
      switch (props.goalstatus) {
        case GoalStatus.ACTIVE:
          return '#2196F3';
        default:
          return 'white';
      }
    }};
    border: ${props => {
      // For MEDIUM+ difficulties, FUNDED status should have no border
      if (props.goalstatus === GoalStatus.FUNDED && 
          (props.difficulty === 'MEDIUM' || props.difficulty === 'HARD' || props.difficulty === 'HARDCORE')) {
        return 'none';
      }
      
      switch (props.goalstatus) {
        case GoalStatus.ACTIVE:
          return '1px solid #2196F3';
        default:
          return 'none';
      }
    }};
    font-weight: 500;
    text-transform: none;
    
    @media (max-width: 768px) {
      font-size: 0.875rem;
      padding: 8px 12px;
    }

    &:hover {
      opacity: 0.9;
      background-color: ${props => {
        // For MEDIUM+ difficulties, FUNDED status should have darker blue hover
        if (props.goalstatus === GoalStatus.FUNDED && 
            (props.difficulty === 'MEDIUM' || props.difficulty === 'HARD' || props.difficulty === 'HARDCORE')) {
          return '#1976d2';
        }
        
        switch (props.goalstatus) {
          case GoalStatus.PENDING:
            return '#757575';
          case GoalStatus.FUNDED:
            return '#f57c00';
          case GoalStatus.ACTIVE:
            return 'rgba(33, 150, 243, 0.1)';
          case GoalStatus.COMPLETED:
            return '#388e3c';
          case GoalStatus.FAILED:
            return '#d32f2f';
          default:
            return '#1976d2';
        }
      }};
    }
  }
`;

const Description = styled(Box)`
  margin: 16px 0;
  line-height: 1.6;

  table {
    width: 100%;
    border-collapse: collapse;
    margin: 1rem 0;
    font-size: 0.9em;
    overflow-x: auto;
    display: block;
    white-space: nowrap;
    
    @media (max-width: 768px) {
      font-size: 0.8em;
    }
  }

  th, td {
    padding: 0.75rem;
    border: 1px solid #ddd;
    text-align: left;
    
    @media (max-width: 768px) {
      padding: 0.5rem;
    }
  }

  th {
    background-color: #f5f5f5;
    font-weight: 600;
  }

  tr:nth-child(even) {
    background-color: #f9f9f9;
  }

  tr:hover {
    background-color: #f5f5f5;
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

const getStatusLabel = (status: GoalStatus, difficulty?: string): string => {
  switch (status) {
    case GoalStatus.PENDING:
      return 'Awaiting Funds';
    case GoalStatus.FUNDED:
      // For MEDIUM+ difficulties, FUNDED means ready to publish
      // For other difficulties, FUNDED means already published
      if (difficulty === 'MEDIUM' || difficulty === 'HARD' || difficulty === 'HARDCORE') {
        return 'Publish';
      }
      return 'Unpublish';
    case GoalStatus.ACTIVE:
      // For MEDIUM+ difficulties, ACTIVE means already published
      // For other difficulties, ACTIVE means ready to publish
      if (difficulty === 'MEDIUM' || difficulty === 'HARD' || difficulty === 'HARDCORE') {
        return 'Unpublish';
      }
      return 'Publish';
    case GoalStatus.COMPLETED:
      return 'Complete Goal';
    case GoalStatus.FAILED:
      return 'Mark as Failed';
    default:
      return status;
  }
};

const getActionLabel = (currentStatus: GoalStatus, nextStatus: GoalStatus, difficulty?: string): string => {
  // For MEDIUM+ difficulties, FUNDED -> ACTIVE means "Publish"
  if (currentStatus === GoalStatus.FUNDED && nextStatus === GoalStatus.ACTIVE && 
      (difficulty === 'MEDIUM' || difficulty === 'HARD' || difficulty === 'HARDCORE')) {
    return 'Publish';
  }
  
  // For MEDIUM+ difficulties, ACTIVE -> FUNDED means "Unpublish"
  if (currentStatus === GoalStatus.ACTIVE && nextStatus === GoalStatus.FUNDED && 
      (difficulty === 'MEDIUM' || difficulty === 'HARD' || difficulty === 'HARDCORE')) {
    return 'Unpublish';
  }
  
  // For other cases, use the original logic
  return getStatusLabel(nextStatus, difficulty);
};

const getNextAllowedStatuses = (
  currentStatus: GoalStatus, 
  walletBalance: string | undefined, 
  difficulty?: string,
  blockchainData?: any
): GoalStatus[] => {
  // For EASY mode, skip ACTIVE status and allow direct transitions to COMPLETED/FAILED
  if (difficulty === 'EASY') {
    // For EASY goals, only allow COMPLETED/FAILED if there are funds
    const hasFunds = walletBalance && Number(walletBalance) > 0;
    
    switch (currentStatus) {
      case GoalStatus.PENDING:
        // EASY goals can only go to COMPLETED or FAILED from PENDING if they have funds
        return hasFunds ? [GoalStatus.COMPLETED, GoalStatus.FAILED] : [];
      case GoalStatus.FUNDED:
        // EASY goals can go directly to COMPLETED or FAILED from FUNDED
        return [GoalStatus.COMPLETED, GoalStatus.FAILED];
      case GoalStatus.ACTIVE:
        return [GoalStatus.COMPLETED, GoalStatus.FAILED];
      case GoalStatus.COMPLETED:
      case GoalStatus.FAILED:
        return [];
      default:
        return [];
    }
  }

  // For MEDIUM+ difficulties, check blockchain data
  if (difficulty === 'MEDIUM' || difficulty === 'HARD' || difficulty === 'HARDCORE') {
    switch (currentStatus) {
      case GoalStatus.PENDING:
        // Only allow FUNDED if there's money in blockchain contract
        if (blockchainData && Number(blockchainData.amount) > 0) {
          return [GoalStatus.FUNDED];
        }
        return [];
      case GoalStatus.FUNDED:
        return [GoalStatus.ACTIVE];
      case GoalStatus.ACTIVE:
        // For MEDIUM+ difficulties, COMPLETED and FAILED can only be set via smart contract
        // through the mark-complete endpoint, not through direct status changes
        return [GoalStatus.FUNDED];
      case GoalStatus.COMPLETED:
      case GoalStatus.FAILED:
        return [];
      default:
        return [];
    }
  }

  // Default logic for other modes (UNSET, etc.)
  switch (currentStatus) {
    case GoalStatus.PENDING:
      return walletBalance && walletBalance !== '0' ? [GoalStatus.FUNDED] : [];
    case GoalStatus.FUNDED:
      return [GoalStatus.ACTIVE];
    case GoalStatus.ACTIVE:
      return [GoalStatus.FUNDED, GoalStatus.COMPLETED, GoalStatus.FAILED];
    case GoalStatus.COMPLETED:
    case GoalStatus.FAILED:
      return [];
    default:
      return [];
  }
};

interface GoalInfoTabProps {
  goal: GoalWithWallet;
  totalBalanceUSD: number;
  canDeleteGoal: boolean;
  canEditGoal: boolean;
  onStatusUpdate: (status: GoalStatus) => void;
  onDelete: () => void;
  onShareClick: () => void;
  onTabChange: (tab: 'edit') => void;
}

const GoalInfoTab: React.FC<GoalInfoTabProps> = ({
  goal,
  totalBalanceUSD,
  canDeleteGoal,
  canEditGoal,
  onStatusUpdate,
  onDelete,
  onShareClick,
  onTabChange
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  
  // Confirmation dialog states
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [statusDialogOpen, setStatusDialogOpen] = useState(false);
  const [pendingStatus, setPendingStatus] = useState<GoalStatus | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Blockchain data states
  const [blockchainData, setBlockchainData] = useState<any>(null);
  const [blockchainLoading, setBlockchainLoading] = useState(false);
  const [blockchainError, setBlockchainError] = useState<string | null>(null);

  // Fetch blockchain data for MEDIUM+ difficulties
  useEffect(() => {
    const fetchBlockchainData = async () => {
      if (goal.difficulty === 'MEDIUM' || goal.difficulty === 'HARD' || goal.difficulty === 'HARDCORE') {
        setBlockchainLoading(true);
        setBlockchainError(null);
        
        try {
          // Generate the same goal ID that was used when committing to blockchain
          const goalId = generateGoalId(goal.userId.toString(), goal.id);
          
          // Fetch blockchain data
          const blockchainGoal = await getGoal(goalId);
          setBlockchainData(blockchainGoal);
        } catch (error: any) {
          if (
            error.reason === 'LazChain: goal does not exist' ||
            (error.message && error.message.includes('goal does not exist'))
          ) {
            setBlockchainError('This goal has not yet been committed to the blockchain, or the transaction failed.');
          } else {
            setBlockchainError(error.message || 'Failed to fetch blockchain data');
          }
        } finally {
          setBlockchainLoading(false);
        }
      }
    };

    fetchBlockchainData();
  }, [goal.difficulty, goal.userId, goal.id]);

  // Confirmation handlers
  const handleDeleteClick = () => {
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    setIsLoading(true);
    try {
      await onDelete();
    } finally {
      setIsLoading(false);
      setDeleteDialogOpen(false);
    }
  };

  const handleStatusClick = (status: GoalStatus) => {
    setPendingStatus(status);
    setStatusDialogOpen(true);
  };

  const handleStatusConfirm = async () => {
    if (!pendingStatus) return;
    
    setIsLoading(true);
    try {
      await onStatusUpdate(pendingStatus);
    } finally {
      setIsLoading(false);
      setStatusDialogOpen(false);
      setPendingStatus(null);
    }
  };

  const getStatusConfirmationMessage = (status: GoalStatus) => {
    switch (status) {
      case GoalStatus.ACTIVE:
        // For MEDIUM+ difficulties, ACTIVE means unpublishing
        if (goal.difficulty === 'MEDIUM' || goal.difficulty === 'HARD' || goal.difficulty === 'HARDCORE') {
          return `Are you sure you want to unpublish "${goal.title}"? This will make it private again.`;
        }
        return `Are you sure you want to publish "${goal.title}"? This will make it visible to the public and allow others to donate to your goal.`;
      case GoalStatus.COMPLETED:
        return `Are you sure you want to mark "${goal.title}" as completed? This action cannot be undone.`;
      case GoalStatus.FAILED:
        return `Are you sure you want to mark "${goal.title}" as failed? This action cannot be undone.`;
      default:
        return `Are you sure you want to change the status of "${goal.title}"?`;
    }
  };

  const getStatusConfirmationTitle = (status: GoalStatus) => {
    switch (status) {
      case GoalStatus.ACTIVE:
        // For MEDIUM+ difficulties, ACTIVE means unpublishing
        if (goal.difficulty === 'MEDIUM' || goal.difficulty === 'HARD' || goal.difficulty === 'HARDCORE') {
          return 'Unpublish Goal';
        }
        return 'Publish Goal';
      case GoalStatus.COMPLETED:
        return 'Complete Goal';
      case GoalStatus.FAILED:
        return 'Mark as Failed';
      default:
        return 'Change Status';
    }
  };

  return (
    <TabContent isMobile={isMobile}>
      <Box sx={{ mb: 3 }}>
        <Box 
          display="flex" 
          justifyContent="space-between" 
          alignItems="flex-start" 
          flexWrap="wrap" 
          gap={2}
          sx={{
            flexDirection: { xs: 'column', sm: 'row' },
            alignItems: { xs: 'flex-start', sm: 'flex-start' },
            justifyContent: { xs: 'flex-start', sm: 'space-between' }
          }}
        >
          <Typography 
            variant={isMobile ? "h6" : "h5"} 
            component="h1" 
            fontWeight="bold"
            sx={{ 
              flex: { xs: 'none', sm: 1 }, 
              minWidth: 0,
              width: { xs: '100%', sm: 'auto' }
            }}
          >
            {goal.title}
          </Typography>
          <Box display="flex" gap={1} alignItems="center" flexWrap="wrap">
            <DifficultyBadge 
              difficulty={goal.difficulty || 'UNSET'} 
              label={goal.difficulty || 'UNSET'} 
              icon={<TrendingUpIcon />}
              size={isMobile ? "small" : "medium"}
            />
            <StatusBadge 
              status={goal.status} 
              label={goal.status} 
              size={isMobile ? "small" : "medium"}
            />
          </Box>
        </Box>
      </Box>

      {goal.image && (
        <Box sx={{ display: 'flex', mb: 3 }}>
          <GoalImage
            src={`${config.backendUrl}/${goal.image}`}
            alt="Goal"
          />
        </Box>
      )}

      <Description>
        <ReactMarkdown remarkPlugins={[remarkGfm]}>
          {goal.description}
        </ReactMarkdown>
      </Description>

      <Box mt={3}>
        <InfoItem>
          <Typography variant="body1" fontWeight="600" color="text.secondary">📂 Category</Typography>
          <Typography variant="body1" fontWeight="500">{goal.category}</Typography>
        </InfoItem>
        <InfoItem>
          <Typography variant="body1" fontWeight="600" color="text.secondary">📅 Deadline</Typography>
          <Typography variant="body1" fontWeight="500">{new Date(goal.deadline).toLocaleDateString()}</Typography>
        </InfoItem>
        <InfoItem>
          <Typography variant="body1" fontWeight="600" color="text.secondary">💰 Total Balance</Typography>
          <Typography variant="body1" fontWeight="bold" color="primary" fontSize="1.1rem">
            ${totalBalanceUSD.toFixed(2)} USD + {blockchainData ? `${weiToMetis(blockchainData.amount.toString())} METIS` : '0 METIS'}
          </Typography>
        </InfoItem>
      </Box>

      <Box 
        display="flex" 
        justifyContent="space-between" 
        alignItems="flex-start" 
        mt={3} 
        flexWrap="wrap" 
        gap={1}
        sx={{
          flexDirection: { xs: 'column', md: 'row' },
          alignItems: { xs: 'flex-start', md: 'center' },
          justifyContent: { xs: 'flex-start', md: 'space-between' }
        }}
      >
        <Box display="flex" gap={1} flexWrap="wrap">
          {canEditGoal && (
            <MuiButton 
              variant="outlined" 
              color="info" 
              onClick={() => onTabChange('edit')}
              size={isMobile ? "small" : "medium"}
              startIcon={<EditIcon />}
            >
              Edit Goal
            </MuiButton>
          )}
          {getNextAllowedStatuses(goal.status, totalBalanceUSD.toString(), goal.difficulty, blockchainData)
            .filter(nextStatus => nextStatus !== GoalStatus.COMPLETED && nextStatus !== GoalStatus.FAILED)
            .map((nextStatus) => {
            const isEasy = goal.difficulty === 'EASY';
            const isUnset = goal.difficulty === 'UNSET';
            const isFunded = Number(totalBalanceUSD) > 0;
            const isBlockchainFunded = blockchainData && Number(blockchainData.amount) > 0;
            // For EASY goals, disable buttons if no funds (they can only be deleted)
            // For other difficulties, disable if no funds and not UNSET
            const shouldDisable = isEasy ? !isFunded : (!isEasy && !isUnset && !isFunded && !isBlockchainFunded);
            return (
              <StatusButton
                key={nextStatus}
                goalstatus={nextStatus}
                difficulty={goal.difficulty}
                variant="contained"
                onClick={() => handleStatusClick(nextStatus)}
                size={isMobile ? "small" : "medium"}
                disabled={shouldDisable}
              >
                {getActionLabel(goal.status, nextStatus, goal.difficulty)}
              </StatusButton>
            );
          })}
          {canDeleteGoal && (
            <MuiButton 
              variant="outlined" 
              color="error" 
              onClick={handleDeleteClick}
              size={isMobile ? "small" : "medium"}
            >
              Delete Goal
            </MuiButton>
          )}
        </Box>
        
        {/* Right side buttons - Desktop */}
        <Box display={{ xs: 'none', md: 'flex' }} gap={1} flexWrap="wrap">
          {getNextAllowedStatuses(goal.status, totalBalanceUSD.toString(), goal.difficulty, blockchainData)
            .filter(nextStatus => nextStatus === GoalStatus.COMPLETED || nextStatus === GoalStatus.FAILED)
            .map((nextStatus) => {
            const isEasy = goal.difficulty === 'EASY';
            const isUnset = goal.difficulty === 'UNSET';
            const isFunded = Number(totalBalanceUSD) > 0;
            const isBlockchainFunded = blockchainData && Number(blockchainData.amount) > 0;
            // For EASY goals, disable buttons if no funds (they can only be deleted)
            // For other difficulties, disable if no funds and not UNSET
            const shouldDisable = isEasy ? !isFunded : (!isEasy && !isUnset && !isFunded && !isBlockchainFunded);
            return (
              <StatusButton
                key={nextStatus}
                goalstatus={nextStatus}
                difficulty={goal.difficulty}
                variant="contained"
                onClick={() => handleStatusClick(nextStatus)}
                size="medium"
                disabled={shouldDisable}
              >
                {getActionLabel(goal.status, nextStatus, goal.difficulty)}
              </StatusButton>
            );
          })}
          <MuiButton 
            variant="contained" 
            sx={{ 
              backgroundColor: '#2196F3',
              color: 'white',
              '&:hover': {
                backgroundColor: '#1976d2'
              }
            }}
            onClick={onShareClick}
            size="medium"
            startIcon={<ShareIcon />}
          >
            Share Goal
          </MuiButton>
        </Box>
      </Box>

      {/* Mobile Share Button - shown only on mobile, full width */}
      <Box display={{ xs: 'flex', md: 'none' }} mt={2}>
        <MuiButton 
          variant="contained" 
          sx={{ 
            backgroundColor: '#2196F3',
            color: 'white',
            '&:hover': {
              backgroundColor: '#1976d2'
            }
          }}
          onClick={onShareClick}
          size="medium"
          startIcon={<ShareIcon />}
          fullWidth
        >
          Share Goal
        </MuiButton>
      </Box>

      {/* Delete Confirmation Dialog */}
      <ConfirmationDialog
        isOpen={deleteDialogOpen}
        title="Delete Goal"
        message={`Are you sure you want to delete "${goal.title}"? This action cannot be undone and will permanently remove the goal and all associated data.`}
        confirmText="Delete"
        cancelText="Cancel"
        isLoading={isLoading}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteDialogOpen(false)}
        variant="danger"
      />

      {/* Status Change Confirmation Dialog */}
      <ConfirmationDialog
        isOpen={statusDialogOpen}
        title={pendingStatus ? getStatusConfirmationTitle(pendingStatus) : 'Change Status'}
        message={pendingStatus ? getStatusConfirmationMessage(pendingStatus) : ''}
        confirmText="Confirm"
        cancelText="Cancel"
        isLoading={isLoading}
        onConfirm={handleStatusConfirm}
        onCancel={() => {
          setStatusDialogOpen(false);
          setPendingStatus(null);
        }}
        variant={pendingStatus === GoalStatus.COMPLETED || pendingStatus === GoalStatus.FAILED ? 'danger' : 'primary'}
      />
      
      {/* Show info about MEDIUM+ difficulty goals not being deletable */}
      {(goal.difficulty === 'MEDIUM' || goal.difficulty === 'HARD' || goal.difficulty === 'HARDCORE') && (
        <Alert severity="info" sx={{ mb: 3, mt: 2 }}>
          <Typography variant="body2">
            <strong>Note:</strong> Goals with {goal.difficulty} difficulty cannot be deleted or edit once created,
            as they are committed to the blockchain.
          </Typography>
        </Alert>
      )}

      {/* Show info about EASY difficulty goals with no funds */}
      {goal.difficulty === 'EASY' && Number(totalBalanceUSD) === 0 && (
        <Alert severity="warning" sx={{ mb: 3, mt: 2 }}>
          <Typography variant="body2">
            <strong>Note:</strong> EASY goals with no funds cannot be completed or marked as failed. 
            You can only delete the goal or add funds to proceed.
          </Typography>
        </Alert>
      )}


    </TabContent>
  );
};

export default GoalInfoTab; 