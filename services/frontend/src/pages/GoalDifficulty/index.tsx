import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Button,
  Stack,
  Paper,
  Fade,
  useMediaQuery,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from '@mui/material';
import { styled, useTheme } from '@mui/material/styles';
import { GoalDifficulty } from '../../types/goals';
import { useParams, useNavigate } from 'react-router-dom';
import { config } from '../../config';
import { commitGoal, generateGoalId, metisToWei, parseContractError, waitForTransaction, getContract } from '../../utils/contract';
import { useWallet } from '../../hooks/useWallet';

const Title = styled(Typography)(({ theme }) => ({
  fontSize: '2.5rem',
  fontWeight: 700,
  marginBottom: theme.spacing(4),
  textAlign: 'center',
  background: 'linear-gradient(45deg, #2196F3 30%, #21CBF3 90%)',
  WebkitBackgroundClip: 'text',
  WebkitTextFillColor: 'transparent',
  letterSpacing: '-0.025em',
  lineHeight: 1.2,
}));

const difficulties = [
  {
    value: GoalDifficulty.EASY,
    label: 'Easy',
    description: ''
  },
  {
    value: GoalDifficulty.MEDIUM,
    label: 'Medium',
    description: ''
  },
  {
    value: GoalDifficulty.HARD,
    label: 'Hard',
    description: ''
  },
  {
    value: GoalDifficulty.HARDCORE,
    label: 'Hardcore',
    description: ''
  }
];

const difficultyColors: Record<GoalDifficulty, string> = {
  [GoalDifficulty.EASY]: '#43a047',
  [GoalDifficulty.MEDIUM]: '#1976d2',
  [GoalDifficulty.HARD]: '#d32f2f',
  [GoalDifficulty.HARDCORE]: '#8e24aa',
  [GoalDifficulty.UNSET]: '#bdbdbd',
};

const GoalDifficultyPage = () => {
  const [selected, setSelected] = useState<GoalDifficulty>(GoalDifficulty.EASY);
  const [fadeIn, setFadeIn] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [checking, setChecking] = useState(true);
  const [showWalletDialog, setShowWalletDialog] = useState(false);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { isConnected, connect, isConnecting, error: walletError } = useWallet();
  
  useEffect(() => {
    const checkDifficulty = async () => {
      if (!id) return;
      try {
        const token = localStorage.getItem('cryptogoals_auth_token');
        if (!token) {
          setError('Not authenticated');
          setChecking(false);
          return;
        }
        const response = await fetch(`${config.apiUrl}/goals/${id}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        if (!response.ok) {
          setError('Failed to fetch goal');
          setChecking(false);
          return;
        }
        const goal = await response.json();
        if (goal.difficulty && goal.difficulty !== GoalDifficulty.UNSET) {
          navigate(`/goals/${id}/`);
          return;
        }
      } catch (err) {
        setError('Failed to fetch goal');
      } finally {
        setChecking(false);
      }
    };
    checkDifficulty();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, navigate]);

  const handleTabClick = (value: GoalDifficulty) => {
    setFadeIn(false);
    setTimeout(() => {
      setSelected(value);
      setFadeIn(true);
    }, 150);
  };

  const handleContinue = async () => {
    if (!id) return;
    
    // Check if wallet is connected for MEDIUM+ difficulties
    if ((selected === GoalDifficulty.MEDIUM || selected === GoalDifficulty.HARD || selected === GoalDifficulty.HARDCORE) && !isConnected) {
      setShowWalletDialog(true);
      return;
    }
    
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('cryptogoals_auth_token');
      if (!token) {
        setError('Not authenticated');
        setLoading(false);
        return;
      }

      // First, update the difficulty in the backend
      const response = await fetch(`${config.apiUrl}/goals/${id}/difficulty`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ difficulty: selected })
      });
      
      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.message || 'Failed to update difficulty');
      }

      // If difficulty is MEDIUM or higher, commit to blockchain
      if ([GoalDifficulty.MEDIUM, GoalDifficulty.HARD, GoalDifficulty.HARDCORE].includes(selected)) {
        try {
          console.log('Committing goal to blockchain with difficulty:', selected);
          
          // Get goal details from backend to create blockchain commitment
          const goalResponse = await fetch(`${config.apiUrl}/goals/${id}`, {
            headers: {
              'Authorization': `Bearer ${token}`,
            }
          });
          
          if (!goalResponse.ok) {
            throw new Error('Failed to fetch goal details');
          }
          
          const goalData = await goalResponse.json();
          
          // Generate a unique goal ID for the blockchain
          const goalId = generateGoalId(goalData.userId.toString(), goalData.id);
          
          // Use the goal's actual deadline instead of 30 days from now
          const deadline = Math.floor(new Date(goalData.deadline).getTime() / 1000);
          
          // Set amount based on difficulty (you can adjust these amounts)
          let amountInMetis = '0.001'; // Default for MEDIUM
          switch (selected as GoalDifficulty) {
            case GoalDifficulty.HARD:
              amountInMetis = '0.005';
              break;
            case GoalDifficulty.HARDCORE:
              amountInMetis = '0.01';
              break;
          }
          
          const amountInWei = metisToWei(amountInMetis);
          
          // Use the connected wallet address as recipient
          const { address } = await getContract();
          const recipient = address;
          
          console.log('Blockchain commitment details:', {
            goalId,
            deadline: new Date(deadline * 1000).toISOString(),
            amount: amountInMetis + ' METIS',
            recipient
          });
          
          // Commit to blockchain
          const tx = await commitGoal(goalId, deadline, recipient, amountInWei);
          
          // Wait for transaction confirmation
          const receipt = await waitForTransaction(tx.hash, 1);
          
          console.log('Goal successfully committed to blockchain!', {
            transactionHash: tx.hash,
            blockNumber: receipt.blockNumber
          });
          
        } catch (blockchainError: any) {
          console.error('Blockchain commitment failed:', blockchainError);
          const errorMessage = parseContractError(blockchainError);
          setError(`Difficulty updated but blockchain commitment failed: ${errorMessage}`);
          setLoading(false);
          return;
        }
      }

      navigate(`/goals/${id}/info`);
    } catch (err: any) {
      setError(err.message || 'Failed to update difficulty');
    } finally {
      setLoading(false);
    }
  };

  if (checking) {
    return (
      <Container maxWidth="sm">
        <Box sx={{ py: 4, textAlign: 'center' }}>
          <Typography variant="h6">Checking goal difficulty...</Typography>
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="sm">
      <Box sx={{ py: 4 }}>
        <Title variant="h1">Select Difficulty</Title>
        <Stack
          direction={isMobile ? 'column' : 'row'}
          justifyContent="center"
          alignItems="center"
          spacing={isMobile ? 1.5 : 2}
          sx={{ mb: 4 }}
        >
          {difficulties.map((d) => {
            const isActive = selected === d.value;
            return (
              <Button
                key={d.value}
                variant={isActive ? 'contained' : 'outlined'}
                fullWidth={isMobile}
                sx={{
                  ...(isActive
                    ? {
                        backgroundColor: difficultyColors[d.value],
                        color: '#fff',
                        borderColor: difficultyColors[d.value],
                        fontWeight: 700,
                        fontSize: '1.1rem',
                        borderRadius: 24,
                        minWidth: isMobile ? undefined : 120,
                        margin: isMobile ? '0 0 0.5rem 0' : 1,
                        boxShadow: '0 2px 8px rgba(33,150,243,0.15)',
                        '&:hover': {
                          backgroundColor: difficultyColors[d.value],
                          opacity: 0.9,
                        },
                      }
                    : {
                        fontWeight: 700,
                        fontSize: '1.1rem',
                        borderRadius: 24,
                        minWidth: isMobile ? undefined : 120,
                        margin: isMobile ? '0 0 0.5rem 0' : 1,
                      }),
                }}
                onClick={() => handleTabClick(d.value)}
                disableElevation
              >
                {d.label}
              </Button>
            );
          })}
        </Stack>
        <Fade in={fadeIn} timeout={300}>
          <Paper
            elevation={6}
            sx={{
              p: 4,
              minHeight: 220,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'opacity 0.3s, filter 0.3s',
              backgroundColor:
                selected === GoalDifficulty.EASY
                  ? '#f1f8e9'
                  : selected === GoalDifficulty.MEDIUM
                  ? '#e3f2fd'
                  : undefined
            }}
          >
            <Typography variant="h5" sx={{ fontWeight: 700, mb: 2, color: difficultyColors[selected] }}>
              {difficulties.find(d => d.value === selected)?.label}
            </Typography>

            {selected === GoalDifficulty.EASY ? (
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="h6" sx={{ fontWeight: 600, color: '#43a047', mb: 1 }}>
                  🌱 Gentle Start, Flexible Journey
                </Typography>
                <Typography variant="body1" sx={{ color: 'text.secondary', mb: 1.5 }}>
                  Complete your goal at your own pace. No pressure, no commitments — just progress.
                </Typography>
                <Stack spacing={1} alignItems="center">
                  <Typography variant="body2" sx={{ color: 'text.secondary' }}>✅ Edit anytime</Typography>
                  <Typography variant="body2" sx={{ color: 'text.secondary' }}>🔗 Shareable link</Typography>
                  <Typography variant="body2" sx={{ color: 'text.secondary' }}>🤖 Free AI agent support</Typography>
                  <Typography variant="body2" sx={{ color: 'text.secondary' }}>💸 Funds optional</Typography>
                </Stack>
              </Box>
            ) : selected === GoalDifficulty.MEDIUM ? (
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="h6" sx={{ fontWeight: 600, color: '#1976d2', mb: 1 }}>
                  🧭 The Standard Path
                </Typography>
                <Typography variant="body1" sx={{ color: 'text.secondary', mb: 1.5 }}>
                  The balanced journey — clear structure with smart AI support and optional funding outcomes.
                </Typography>
                <Stack spacing={1} alignItems="center">
                  <Typography variant="body2" sx={{ color: 'text.secondary' }}>📢 Publish and share your goal</Typography>
                  <Typography variant="body2" sx={{ color: 'text.secondary' }}>🔁 Token refund on success or failure</Typography>
                  <Typography variant="body2" sx={{ color: 'text.secondary' }}>🎯 Goal must be completed or failed</Typography>
                  <Typography variant="body2" sx={{ color: 'text.secondary' }}>🤖 Advanced GPT & Claude AI support</Typography>
                  <Typography variant="body2" sx={{ color: 'text.secondary' }}>💰 Funds go back, stay, or support others</Typography>
                </Stack>
              </Box>
            ) : selected === GoalDifficulty.HARD ? (
              <Box
                sx={{
                  textAlign: 'center',
                  opacity: 0.6,
                  filter: 'grayscale(0.4)',
                  pointerEvents: 'none',
                  userSelect: 'none',
                }}
              >
                <Typography variant="h6" sx={{ fontWeight: 600, color: difficultyColors[selected], mb: 1 }}>
                  🔒 Advanced Commitment
                </Typography>
                <Typography variant="body1" sx={{ color: 'text.secondary', mb: 1.5 }}>
                  This mode is in development. It requires stronger focus and commitment, with stricter rules.
                </Typography>
                <Stack spacing={1} alignItems="center">
                  <Typography variant="body2" sx={{ color: 'text.secondary' }}>⛔ Funds locked until goal success</Typography>
                  <Typography variant="body2" sx={{ color: 'text.secondary' }}>🎯 No early completion allowed</Typography>
                  <Typography variant="body2" sx={{ color: 'text.secondary' }}>🔬 Expanded AI with research tools</Typography>
                  <Typography variant="body2" sx={{ color: 'text.secondary' }}>💥 Higher minimum stake</Typography>
                </Stack>
              </Box>
            ) : (
              <Box
                sx={{
                  textAlign: 'center',
                  opacity: 0.6,
                  filter: 'grayscale(0.4)',
                  pointerEvents: 'none',
                  userSelect: 'none',
                }}
              >
                <Typography variant="h6" sx={{ fontWeight: 600, color: difficultyColors[selected], mb: 1 }}>
                  🔒 Coach Mode & Full Dedication
                </Typography>
                <Typography variant="body1" sx={{ color: 'text.secondary', mb: 1.5 }}>
                  The most intense mode — guided by real humans and powerful AI, with full transparency.
                </Typography>
                <Stack spacing={1} alignItems="center">
                  <Typography variant="body2" sx={{ color: 'text.secondary' }}>👤 Real human coach + AI</Typography>
                  <Typography variant="body2" sx={{ color: 'text.secondary' }}>📈 Full progress tracking & task reporting</Typography>
                  <Typography variant="body2" sx={{ color: 'text.secondary' }}>💰 $100+ commitment required</Typography>
                  <Typography variant="body2" sx={{ color: 'text.secondary' }}>🪙 All funds lost on failure</Typography>
                </Stack>
              </Box>
            )}

            <Box sx={{ mt: 2, textAlign: 'center' }}>
              {(selected === GoalDifficulty.EASY || selected === GoalDifficulty.MEDIUM) ? (
                <Button
                  variant="contained"
                  color="primary"
                  size="large"
                  onClick={handleContinue}
                  disabled={loading}
                >
                  {loading ? 'Saving...' : 'Continue'}
                </Button>
              ) : (
                <></>
              )}
            </Box>
            {error && (
              <Typography color="error" sx={{ mt: 2, textAlign: 'center' }}>{error}</Typography>
            )}
            {walletError && (
              <Alert severity="error" sx={{ mt: 2 }}>{walletError}</Alert>
            )}
          </Paper>
        </Fade>
        
        {/* Info Panel for MEDIUM difficulty - shown under the difficulty panel */}
        {selected === GoalDifficulty.MEDIUM && (
          <Fade in={fadeIn} timeout={300}>
            <Alert 
              severity="info" 
              sx={{ 
                mt: 3, 
                textAlign: 'left',
                '& .MuiAlert-message': {
                  width: '100%'
                }
              }}
            >
              <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
                💡 Blockchain Commitment Details
              </Typography>
              <Stack spacing={0.5}>
                <Typography variant="body2">
                  • <strong>Commit Amount:</strong> Fixed at 0.001 test METIS
                </Typography>
                <Typography variant="body2">
                  • <strong>Refund Address:</strong> Same as your connected wallet address
                </Typography>
                <Typography variant="body2">
                  • <strong>Transaction:</strong> You'll need to sign a blockchain transaction
                </Typography>
                <Typography variant="body2">
                  • <strong>Security:</strong> Funds are locked in a smart contract until goal completion
                </Typography>
              </Stack>
            </Alert>
          </Fade>
        )}
      </Box>
      
      {/* Wallet Connection Dialog */}
      <Dialog open={showWalletDialog} onClose={() => setShowWalletDialog(false)}>
        <DialogTitle>Connect Wallet Required</DialogTitle>
        <DialogContent>
          <Typography>
            To commit your goal to the blockchain, you need to connect your wallet first.
            This allows you to stake METIS tokens and participate in the goal commitment system.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowWalletDialog(false)}>Cancel</Button>
          <Button 
            onClick={async () => {
              try {
                await connect();
                setShowWalletDialog(false);
                // Retry the continue action
                handleContinue();
              } catch (error) {
                console.error('Failed to connect wallet:', error);
              }
            }}
            disabled={isConnecting}
            variant="contained"
          >
            {isConnecting ? 'Connecting...' : 'Connect Wallet'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default GoalDifficultyPage;
