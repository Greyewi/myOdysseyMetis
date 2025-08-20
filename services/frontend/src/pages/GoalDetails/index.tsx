import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import styled from 'styled-components';
import { GoalStatus, GoalWithWallet, GoalCategory, GoalDifficulty } from '../../types/goals';
import { useGoals } from '../../provider/goalProvider';
import { useQuery } from '@tanstack/react-query';
import GoalView from './GoalView';
import { config } from '@/config';

const TOKEN_KEY = 'cryptogoals_auth_token';

const Container = styled.div`
  margin: 2rem auto;
  padding: 0 1rem;
`;

const Title = styled.h1`
  font-size: 2rem;
  margin-bottom: 2rem;
  color: #333;
`;

const LoadingContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 60vh;
  text-align: center;
  padding: 2rem;
`;

const LoadingSpinner = styled.div`
  width: 48px;
  height: 48px;
  border: 4px solid #e2e8f0;
  border-top: 4px solid #0ea5e9;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 1.5rem;
  
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;

const LoadingText = styled.h2`
  color: #475569;
  font-size: 1.5rem;
  font-weight: 600;
  margin-bottom: 0.5rem;
`;

const LoadingSubtext = styled.p`
  color: #64748b;
  font-size: 1rem;
  margin: 0;
`;

const ErrorContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 60vh;
  text-align: center;
  padding: 2rem;
`;

const ErrorIcon = styled.div`
  width: 64px;
  height: 64px;
  background: #fef2f2;
  border: 2px solid #fecaca;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 1.5rem;
  font-size: 2rem;
`;

const ErrorTitle = styled.h2`
  color: #dc2626;
  font-size: 1.5rem;
  font-weight: 600;
  margin-bottom: 0.5rem;
`;

const ErrorMessage = styled.p`
  color: #64748b;
  font-size: 1rem;
  margin-bottom: 1.5rem;
  max-width: 500px;
  line-height: 1.6;
`;

const RefreshButton = styled.button`
  background: linear-gradient(135deg, #0369a1 0%, #0ea5e9 50%, rgb(14, 165, 233) 100%);
  color: white;
  border: none;
  padding: 12px 24px;
  border-radius: 8px;
  font-weight: 600;
  font-size: 1rem;
  cursor: pointer;
  transition: all 0.2s ease;
  
  &:hover {
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(14, 165, 233, 0.2);
  }
  
  &:active {
    transform: translateY(0);
  }
`;

const RefreshTimer = styled.div`
  margin-top: 1rem;
  color: #64748b;
  font-size: 0.9rem;
`;

interface FormData {
  title: string;
  description: string;
  status: GoalStatus;
  category: GoalCategory;
  image?: File | string;
  weeklyTimeCommitment?: number;
  currentExperience?: string;
  availableResources?: string;
  startingPoint?: string;
}

type TabType = 'info' | 'ai-evaluation' | 'wallets' | 'tasks' | 'edit' | 'contract';

// Map between URL paths and internal tab types
const URL_TO_TAB_MAP: Record<string, TabType> = {
  'info': 'info',
  'ai': 'ai-evaluation',
  'wallets': 'wallets', 
  'tasks': 'tasks',
  'edit': 'edit',
  'contract': 'contract'
};

const TAB_TO_URL_MAP: Record<TabType, string> = {
  'info': 'info',
  'ai-evaluation': 'ai',
  'wallets': 'wallets',
  'tasks': 'tasks', 
  'edit': 'edit',
  'contract': 'contract'
};

const GoalDetails = () => {
  const { id, tab } = useParams<{ id: string; tab?: string }>();
  const navigate = useNavigate();
  const { getGoalById, updateGoal, updateGoalStatus, updateWalletBalance, deleteGoal } = useGoals();
  
  const [error, setError] = useState<string | null>(null);
  const [refreshTimer, setRefreshTimer] = useState<number>(0);
  const [formData, setFormData] = useState<FormData>({
    title: '',
    description: '',
    status: GoalStatus.PENDING,
    category: GoalCategory.PERSONAL,
    image: undefined,
    weeklyTimeCommitment: undefined,
    currentExperience: '',
    availableResources: '',
    startingPoint: ''
  });

  // Use TanStack Query to fetch and cache the goal data
  const { 
    data: goal, 
    isLoading,
    error: queryError,
    refetch: refetchGoal 
  } = useQuery({
    queryKey: ['goal', Number(id)],
    queryFn: () => getGoalById(Number(id)),
    enabled: !!id,
    retry: 2,
    retryDelay: 1000,
  });

  // Timer effect for refresh countdown
  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (queryError && refreshTimer > 0) {
      interval = setInterval(() => {
        setRefreshTimer(prev => {
          if (prev <= 1) {
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    
    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [queryError, refreshTimer]);

  // Update form data when goal data changes
  useEffect(() => {
    if (goal) {
      setFormData({
        title: goal.title,
        description: goal.description,
        status: goal.status as GoalStatus,
        category: goal.category as GoalCategory,
        image: goal.image,
        weeklyTimeCommitment: typeof goal.weeklyTimeCommitment === 'string' 
          ? parseInt(goal.weeklyTimeCommitment, 10) 
          : goal.weeklyTimeCommitment || undefined,
        currentExperience: goal.currentExperience || '',
        availableResources: goal.availableResources || '',
        startingPoint: goal.startingPoint || ''
      });
      setError(null);
    }
  }, [goal]);

  if (goal && goal.difficulty === GoalDifficulty.UNSET) {
    navigate(`/goals/${id}/difficulty`, { replace: true });
  }

  useEffect(() => {
    const token = localStorage.getItem(TOKEN_KEY);
    if (!token) {
      navigate('/');
    }
  }, [navigate]);

  useEffect(() => {
    if (id && !tab) {
      navigate(`/goals/${id}/info`, { replace: true });
      return;
    }
    
    if (tab && !URL_TO_TAB_MAP[tab]) {
      navigate(`/goals/${id}/info`, { replace: true });
    }
  }, [id, tab, navigate]);

  const handleStatusUpdate = async (newStatus: GoalStatus) => {
    if (!id) return;
    
    try {
      await updateGoalStatus(Number(id), newStatus);
      refetchGoal(); // Refetch goal data after status update
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    }
  };

  const handleDelete = async () => {
    if (!id) return;
    if (!window.confirm('Are you sure you want to delete this goal?')) return;
    
    try {
      await deleteGoal(Number(id));
      navigate('/my-goals');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete goal');
    }
  };

  const handleUpdateBalance = async () => {
    try {
      if (!goal?.wallets?.[0]?.id) {
        setError('Wallet not found');
        return;
      }
      await updateWalletBalance(goal.wallets[0].id);
      refetchGoal();
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update balance');
    }
  };

  const handleGoalUpdate = async () => {
    await refetchGoal();
  };

  const handleRefresh = async () => {
    setRefreshTimer(120); // 2 minutes
    await refetchGoal();
  };

  const handleTabChange = (newTab: TabType) => {
    if (id) {
      const urlTab = TAB_TO_URL_MAP[newTab];
      navigate(`/goals/${id}/${urlTab}`);
    }
  };

  if (isLoading) {
    return (
      <Container>
        <LoadingContainer>
          <LoadingSpinner />
          <LoadingText>Loading your goal...</LoadingText>
          <LoadingSubtext>Please wait while we fetch the details</LoadingSubtext>
        </LoadingContainer>
      </Container>
    );
  }

  if (queryError || !goal) {
    return (
      <Container>
        <ErrorContainer>
          <ErrorIcon>⚠️</ErrorIcon>
          <ErrorTitle>Unable to load goal</ErrorTitle>
          <ErrorMessage>
            We encountered an issue while loading your goal. This might be due to a temporary network issue or the goal may not exist.
          </ErrorMessage>
          <RefreshButton onClick={handleRefresh}>
            Try Again
          </RefreshButton>
          {refreshTimer > 0 && (
            <RefreshTimer>
              You can try refreshing in {Math.floor(refreshTimer / 60)}:{(refreshTimer % 60).toString().padStart(2, '0')}
            </RefreshTimer>
          )}
        </ErrorContainer>
      </Container>
    );
  }

  const currentTab = tab ? URL_TO_TAB_MAP[tab] || 'info' : 'info';

  return (
    <Container>
      {error && <div style={{ color: 'red', marginBottom: '1rem' }}>{error}</div>}
      <GoalView
          goal={goal}
          onDelete={handleDelete}
          onStatusUpdate={handleStatusUpdate}
          onBack={() => navigate('/my-goals')}
          onGoalUpdate={handleGoalUpdate}
          activeTab={currentTab}
          onTabChange={handleTabChange}
        />
    </Container>
  );
};

export default GoalDetails; 