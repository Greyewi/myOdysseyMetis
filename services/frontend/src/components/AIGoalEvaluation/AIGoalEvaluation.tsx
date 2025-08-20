import React, { useState } from 'react';
import styled, { keyframes } from 'styled-components';
import { GoalWithWallet } from '../../types/goals';
import { reevaluateGoal } from '../../app/api/goals';
import { 
  Box, 
  LinearProgress, 
  Chip, 
  Typography,
  Card as MuiCard,
  CardContent 
} from '@mui/material';

interface AIGoalEvaluationProps {
  goal: GoalWithWallet;
  totalBalanceUSD: number;
  onGoalUpdate: () => void;
  blockchainData?: any;
  canReevaluate?: boolean;
}

const EvaluationContainer = styled.div`
  margin: 1.5rem 0;
  padding: 1.5rem;
  background: #f8f9fa;
  border-radius: 8px;
  border: 1px solid #e9ecef;
`;

const EvaluationHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
`;

const ScoreDisplay = styled.div<{ score: number }>`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 1.1rem;
  font-weight: 600;
  color: ${props => {
    if (props.score >= 0.8) return '#4CAF50';
    if (props.score >= 0.6) return '#ff9800';
    if (props.score >= 0.4) return '#ff5722';
    return '#f44336';
  }};
`;

const ScoreBar = styled.div<{ score: number }>`
  width: 100px;
  height: 8px;
  background-color: #e0e0e0;
  border-radius: 4px;
  overflow: hidden;
  
  &::after {
    content: '';
    display: block;
    width: ${props => props.score * 100}%;
    height: 100%;
    background-color: ${props => {
      if (props.score >= 0.8) return '#4CAF50';
      if (props.score >= 0.6) return '#ff9800';
      if (props.score >= 0.4) return '#ff5722';
      return '#f44336';
    }};
    transition: width 0.3s ease;
  }
`;

const Button = styled.button<{ variant?: 'primary' | 'secondary' | 'danger' | 'outlined' }>`
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 4px;
  font-weight: 500;
  cursor: pointer;
  opacity: 1;
  background-color: ${props => {
    switch (props.variant) {
      case 'secondary':
        return '#9e9e9e';
      case 'danger':
        return '#f44336';
      case 'outlined':
        return 'transparent';
      default:
        return '#2196F3';
    }
  }};
  border: ${props => props.variant === 'outlined' ? '2px solid #2196F3' : 'none'};
  color: ${props => props.variant === 'outlined' ? '#2196F3' : 'white'};

  &:hover {
    opacity: 0.9;
  }

  &:disabled {
    background-color: #ccc;
    cursor: not-allowed;
  }
`;

const LoadingSpinner = styled.div`
  display: inline-block;
  width: 1rem;
  height: 1rem;
  border: 2px solid #ffffff;
  border-radius: 50%;
  border-top-color: transparent;
  animation: spin 1s linear infinite;
  margin-right: 0.5rem;
  
  @keyframes spin {
    to { transform: rotate(360deg); }
  }
`;

const AnalysisDetailsContainer = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  margin-top: 16px;
`;

const getScoreValue = (value: string): number => {
  const scoreMap: { [key: string]: number } = {
    'excellent': 100,
    'very good': 90,
    'good': 80,
    'adequate': 70,
    'fair': 60,
    'poor': 40,
    'very poor': 20,
    'none': 0,
    'low': 30,
    'medium': 60,
    'high': 90,
    'very high': 100
  };
  
  return scoreMap[value.toLowerCase()] || 50;
};

const getChipColor = (value: string): 'success' | 'warning' | 'error' | 'default' => {
  const score = getScoreValue(value);
  if (score >= 80) return 'success';
  if (score >= 60) return 'warning';
  if (score >= 40) return 'error';
  return 'default';
};

const AnalysisDetailsChart: React.FC<{ analysisDetails: any }> = ({ analysisDetails }) => {
  if (!analysisDetails || typeof analysisDetails !== 'object') {
    return null;
  }

  const formatLabel = (key: string): string => {
    return key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
  };
  
  return (
    <AnalysisDetailsContainer>
        {Object.entries(analysisDetails).map(([key, value]) => {
          if(key === "historicalInsights") return;
          
          // Handle new format with score and explanation
          if (typeof value === 'object' && value !== null && 'score' in value) {
            const evaluationData = value as { score: number; explanation?: string };
            const scoreValue = typeof evaluationData.score === 'number' ? evaluationData.score * 100 : 0;
            const explanation = evaluationData.explanation || '';
            const chipColor = scoreValue >= 80 ? 'success' : 
                             scoreValue >= 60 ? 'warning' : 
                             scoreValue >= 40 ? 'error' : 'default';
            
            return (
              <div key={key} style={{ 
                flex: '1 1 300px', 
                minWidth: '280px',
                maxWidth: '350px'
              }}>
                <MuiCard style={{ height: '100%', border: '1px solid #e0e0e0' }}>
                  <CardContent style={{ paddingBottom: '16px' }}>
                    <Typography variant="subtitle2" gutterBottom style={{ fontWeight: 600 }}>
                      {formatLabel(key)}
                    </Typography>
                    
                    <div style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: '8px', 
                      marginBottom: '8px' 
                    }}>
                      <Chip 
                        label={`${Math.round(scoreValue)}%`}
                        color={chipColor}
                        size="small"
                        style={{ fontWeight: 500 }}
                      />
                    </div>
                    {explanation && (
                      <Typography variant="body2" style={{ 
                        color: '#666', 
                        marginBottom: '8px',
                        fontSize: '0.875rem',
                        lineHeight: 1.4
                      }}>
                        {explanation}
                      </Typography>
                    )}
                    
                    <div style={{ width: '100%' }}>
                      <LinearProgress 
                        variant="determinate" 
                        value={scoreValue} 
                        sx={{
                          height: 8,
                          borderRadius: 4,
                          backgroundColor: '#f0f0f0',
                          '& .MuiLinearProgress-bar': {
                            borderRadius: 4,
                            backgroundColor: 
                              scoreValue >= 80 ? '#4caf50' :
                              scoreValue >= 60 ? '#ff9800' :
                              scoreValue >= 40 ? '#f44336' : '#9e9e9e'
                          }
                        }}
                      />
                      <Typography variant="caption" style={{ 
                        color: '#666', 
                        marginTop: '4px', 
                        display: 'block' 
                      }}>
                        {Math.round(scoreValue)}%
                      </Typography>
                    </div>
                  </CardContent>
                </MuiCard>
              </div>
            );
          }
          
          // Handle legacy format with string values
          const stringValue = String(value);
          const score = getScoreValue(stringValue);
          const chipColor = getChipColor(stringValue);
          
          return (
            <div key={key} style={{ 
              flex: '1 1 300px', 
              minWidth: '280px',
              maxWidth: '350px'
            }}>
              <MuiCard style={{ height: '100%', border: '1px solid #e0e0e0' }}>
                <CardContent style={{ paddingBottom: '16px' }}>
                  <Typography variant="subtitle2" gutterBottom style={{ fontWeight: 600 }}>
                    {formatLabel(key)}
                  </Typography>
                  
                  <div style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '8px', 
                    marginBottom: '8px' 
                  }}>
                    <Chip 
                      label={stringValue} 
                      color={chipColor}
                      size="small"
                      style={{ fontWeight: 500 }}
                    />
                  </div>
                  
                  <div style={{ width: '100%' }}>
                    <LinearProgress 
                      variant="determinate" 
                      value={score} 
                      sx={{
                        height: 8,
                        borderRadius: 4,
                        backgroundColor: '#f0f0f0',
                        '& .MuiLinearProgress-bar': {
                          borderRadius: 4,
                          backgroundColor: 
                            score >= 80 ? '#4caf50' :
                            score >= 60 ? '#ff9800' :
                            score >= 40 ? '#f44336' : '#9e9e9e'
                        }
                      }}
                    />
                    <Typography variant="caption" style={{ 
                      color: '#666', 
                      marginTop: '4px', 
                      display: 'block' 
                    }}>
                      {score}%
                    </Typography>
                  </div>
                </CardContent>
              </MuiCard>
            </div>
          );
        })}
    </AnalysisDetailsContainer>
  );
};

const AIGoalEvaluation: React.FC<AIGoalEvaluationProps> = ({ 
  goal, 
  totalBalanceUSD, 
  onGoalUpdate,
  blockchainData
}) => {
  const [isReevaluating, setIsReevaluating] = useState<boolean>(false);

  // Check if goal has all required AI fields
  const hasAllAIFields = Boolean(
    goal.weeklyTimeCommitment && 
    goal.currentExperience && 
    goal.availableResources && 
    goal.startingPoint
  );

  // Check if goal can be reevaluated (has funding > $0.0001)
  // For MEDIUM+ difficulties, use blockchain data to determine if re-evaluation is possible
  const canReevaluate = hasAllAIFields && (
    goal.difficulty === 'EASY' ? 
      (totalBalanceUSD > 0.0001) : 
      (blockchainData && !blockchainData.completed && !blockchainData.claimed && Number(blockchainData.amount) > 0)
  );

  const handleReevaluate = async () => {
    if (!canReevaluate) {
      return;
    }
    
    setIsReevaluating(true);
    try {
      await reevaluateGoal(goal.id);
      onGoalUpdate(); // Refresh the goal data
    } catch (error) {
      console.error('Failed to reevaluate goal:', error);
      alert(`Failed to reevaluate goal: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsReevaluating(false);
    }
  };

  // Show message if no evaluation data and no AI fields
  if (!goal.evaluation && !hasAllAIFields) {
    return (
      <div style={{ 
        margin: '1.5rem 0', 
        padding: '1.5rem', 
        background: '#f8f9fa', 
        border: '1px solid #e9ecef', 
        borderRadius: '8px',
        textAlign: 'center'
      }}>
        <h3 style={{ marginTop: 0, marginBottom: '1rem', color: '#495057' }}>No AI Evaluation Available</h3>
        <p style={{ color: '#6c757d', marginBottom: 0 }}>
          To get an AI evaluation of your goal, please edit your goal and provide the AI assistant information 
          (weekly time commitment, current experience, available resources, and starting point). 
          Once you have funding and complete this information, you can request an AI evaluation.
        </p>
      </div>
    );
  }

  return (
    <>
      {/* AI Assistant Information */}
      {(goal.weeklyTimeCommitment || goal.currentExperience || goal.availableResources || goal.startingPoint) && (
        <div style={{ 
          margin: '1.5rem 0', 
          padding: '1.5rem', 
          background: '#f8f9fa', 
          border: '1px solid #e9ecef', 
          borderRadius: '8px' 
        }}>
          <h3 style={{ marginTop: 0, marginBottom: '1rem', color: '#495057' }}>AI Assistant Information</h3>
          {goal.weeklyTimeCommitment && (
            <p><strong>Weekly Time Commitment:</strong> {goal.weeklyTimeCommitment} hours per week</p>
          )}
          {goal.currentExperience && (
            <p><strong>Current Experience:</strong> {goal.currentExperience}</p>
          )}
          {goal.availableResources && (
            <p><strong>Available Resources:</strong> {goal.availableResources}</p>
          )}
          {goal.startingPoint && (
            <p><strong>Starting Point:</strong> {goal.startingPoint}</p>
          )}
        </div>
      )}

      {/* AI Goal Evaluation */}
      {goal.evaluation ? (
        <EvaluationContainer>
          <EvaluationHeader>
            <h3>AI Goal Evaluation</h3>
          </EvaluationHeader>
          
          <ScoreDisplay score={goal.evaluation.achievabilityScore}>
            <span>Achievability Score: {Math.round(goal.evaluation.achievabilityScore * 100)}%</span>
            <ScoreBar score={goal.evaluation.achievabilityScore} />
          </ScoreDisplay>
          <h4>AI Analysis</h4>
          <p>{goal.evaluation.summary}</p>
          {goal.evaluation.analysisDetails && (
            <AnalysisDetailsChart analysisDetails={goal.evaluation.analysisDetails} />
          )}
        </EvaluationContainer>
      ) : hasAllAIFields && (
        <div style={{ 
          margin: '1.5rem 0', 
          padding: '1.5rem', 
          background: '#fff3cd', 
          border: '1px solid #ffeaa7', 
          borderRadius: '8px'
        }}>
          <h3 style={{ marginTop: 0, marginBottom: '1rem', color: '#856404' }}>AI Evaluation Pending</h3>
          <p style={{ color: '#856404', marginBottom: 0 }}>
            Your goal has all the required AI assistant information, but no evaluation has been generated yet. 
            {totalBalanceUSD > 1 
              ? ' Click the "Reevaluate Goal" button below to generate an AI evaluation.'
              : ' Fund your goal with more than $1 to enable AI evaluation.'
            }
          </p>
        </div>
      )}
      
      {/* Reevaluate Button - only show if goal has AI fields */}
      {hasAllAIFields && (
        <div style={{ margin: '1rem 0' }}>
          <Button 
            onClick={handleReevaluate}
            disabled={goal.difficulty !== 'EASY' && (!canReevaluate || isReevaluating)}
            variant="outlined"
          >
            {isReevaluating && <LoadingSpinner />}
            {isReevaluating ? 'Reevaluating...' : 'Reevaluate Goal'}
          </Button>
          {goal.difficulty !== 'EASY' && !canReevaluate && hasAllAIFields && (
            <p style={{ 
              fontSize: '0.875rem', 
              color: '#666', 
              marginTop: '0.5rem',
              marginBottom: '0' 
            }}>
              Goal must have a balance to be reevaluated
            </p>
          )}
        </div>
      )}
    </>
  );
};

export default AIGoalEvaluation; 