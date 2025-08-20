import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { GoalWithWallet } from '@/types/goals';
import AIGoalEvaluation from '../../components/AIGoalEvaluation/AIGoalEvaluation';
import { 
  useTheme, 
  useMediaQuery, 
  Collapse, 
  Button, 
  Box, 
  Typography, 
  TextField,
  Alert,
} from '@mui/material';
import { config } from '@/config';
import { getGoal, generateGoalId } from '@/utils/contract';

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

interface GoalAITabProps {
  goal: GoalWithWallet;
  totalBalanceUSD: number;
  onGoalUpdate: () => void;
}

const isAIFilled = (goal: GoalWithWallet) => {
  return !!(
    goal.weeklyTimeCommitment &&
    goal.currentExperience &&
    goal.availableResources &&
    goal.startingPoint
  );
};

const GoalAITab: React.FC<GoalAITabProps> = ({
  goal,
  totalBalanceUSD,
  onGoalUpdate
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [showForm, setShowForm] = useState(!isAIFilled(goal));
  const [formData, setFormData] = useState({
    weeklyTimeCommitment: goal.weeklyTimeCommitment || '',
    currentExperience: goal.currentExperience || '',
    availableResources: goal.availableResources || '',
    startingPoint: goal.startingPoint || ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Blockchain data states for MEDIUM+ difficulties
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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('cryptogoals_auth_token');
      if (!token) {
        setError('Not authenticated');
        setLoading(false);
        return;
      }
      const form = new FormData();
      form.append('weeklyTimeCommitment', String(formData.weeklyTimeCommitment));
      form.append('currentExperience', String(formData.currentExperience));
      form.append('availableResources', String(formData.availableResources));
      form.append('startingPoint', String(formData.startingPoint));
      const response = await fetch(`${config.apiUrl}/goals/${goal.id}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: form
      });
      if (!response.ok) {
        let errMsg = 'Failed to update AI fields';
        try {
          const text = await response.text();
          if (text) {
            const errData = JSON.parse(text);
            errMsg = errData.message || errMsg;
          }
        } catch (e) {
          // ignore JSON parse errors, use default message
        }
        throw new Error(errMsg);
      }
      setShowForm(false);
      onGoalUpdate();
    } catch (err: any) {
      setError(err.message || 'Failed to update AI fields');
    } finally {
      setLoading(false);
    }
  };

  return (
    <TabContent isMobile={isMobile}>
      <Box mt={3}>
        {isAIFilled(goal) && (
          <Button variant="outlined" onClick={() => setShowForm((v) => !v)} sx={{ mb: 2 }}>
            {showForm ? 'Hide AI Assistant Information' : 'Edit AI Assistant Information'}
          </Button>
        )}
        <Collapse in={showForm}>
          <Box
            sx={{
              margin: '0rem 0 1rem 0',
              padding: '1rem',
              backgroundColor: '#f8f9fa',
              borderRadius: '6px',
              border: '1px solid #e9ecef'
            }}
            component="form"
            onSubmit={handleSubmit}
          >
            <Typography variant="h6" sx={{ mb: 2, color: '#495057', fontWeight: 600 }}>
              AI Assistant Information
            </Typography>
            <Typography sx={{ mb: 3, color: '#6c757d', fontSize: '0.95rem' }}>
              Fill out these fields to enable AI-powered task generation and goal evaluation.
            </Typography>
            <TextField
              label="Weekly Time Commitment (hours per week)"
              type="number"
              name="weeklyTimeCommitment"
              value={formData.weeklyTimeCommitment}
              onChange={handleChange}
              placeholder="e.g., 10"
              inputProps={{ min: 1, max: 168 }}
              fullWidth
              sx={{ mb: 2 }}
            />
            <TextField
              label="Current Experience Level"
              name="currentExperience"
              value={formData.currentExperience}
              onChange={handleChange}
              placeholder="Describe your current experience level with this goal area..."
              fullWidth
              multiline
              minRows={2}
              sx={{ mb: 2 }}
            />
            <TextField
              label="Available Resources"
              name="availableResources"
              value={formData.availableResources}
              onChange={handleChange}
              placeholder="What resources do you have available? (tools, budget, time, etc.)"
              fullWidth
              multiline
              minRows={2}
              sx={{ mb: 2 }}
            />
            <TextField
              label="Starting Point"
              name="startingPoint"
              value={formData.startingPoint}
              onChange={handleChange}
              placeholder="Where are you starting from? What's your current situation?"
              fullWidth
              multiline
              minRows={2}
              sx={{ mb: 2 }}
            />
            <Button
              type="submit"
              variant="contained"
              color="primary"
              disabled={loading}
              sx={{ mt: 2 }}
              fullWidth
            >
              {loading ? 'Saving...' : 'Save AI Info'}
            </Button>
            {error && (
              <Typography color="error" sx={{ mt: 2, textAlign: 'center' }}>{error}</Typography>
            )}
          </Box>
        </Collapse>
      </Box>

      {/* Blockchain Information for MEDIUM+ difficulties */}
      {(goal.difficulty === 'MEDIUM' || goal.difficulty === 'HARD' || goal.difficulty === 'HARDCORE') && (
        <Box mt={3}>
          
          {blockchainLoading && (
            <Box display="flex" justifyContent="center" p={2}>
              <Typography>Loading blockchain data...</Typography>
            </Box>
          )}
          
          {blockchainError && (
            <Alert severity="warning" sx={{ mb: 2 }}>
              {blockchainError}
            </Alert>
          )}
        </Box>
      )}

      <AIGoalEvaluation
        goal={goal}
        totalBalanceUSD={totalBalanceUSD}
        onGoalUpdate={onGoalUpdate}
        blockchainData={blockchainData}
      />
    </TabContent>
  );
};

export default GoalAITab; 