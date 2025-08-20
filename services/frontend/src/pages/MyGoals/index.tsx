import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { useGoals } from '../../provider/goalProvider';
import { GoalStatus, WalletNetwork, GoalWithWallet } from '../../types/goals';
import { ethers } from 'ethers';

const TOKEN_KEY = 'cryptogoals_auth_token';

const Container = styled.div`
  max-width: 1200px;
  margin: 2rem auto;
  padding: 0 1rem;
`;

const Title = styled.h1`
  font-size: 2rem;
  margin-bottom: 2rem;
  color: #333;
`;

const GoalsList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  padding: 1rem 0;
`;

const GoalListItem = styled.div<{ status: GoalStatus }>`
  background: white;
  border-radius: 6px;
  padding: 1rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  border-left: 3px solid ${props => getStatusColor(props.status)};
  transition: transform 0.2s ease, box-shadow 0.2s ease;
  cursor: pointer;
  
  &:hover {
    transform: translateY(-1px);
    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.15);
  }
`;

const GoalHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 0.75rem;
`;

const GoalTitle = styled.h3`
  font-size: 1.1rem;
  margin: 0;
  color: #1a1a1a;
  font-weight: 600;
  flex: 1;
  cursor: pointer;
  transition: color 0.2s ease;
  
  &:hover {
    color: #2196F3;
  }
`;

const GoalContent = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
  align-items: start;
  
  @media (max-width: 768px) {
    grid-template-columns: 1fr;
    gap: 0.75rem;
  }
`;

const GoalInfo = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
`;

const WalletInfo = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`;

const ActionSection = styled.div`
  display: flex;
  justify-content: flex-end;
  align-items: center;
`;

const InfoRow = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.85rem;
`;

const Label = styled.span`
  font-weight: 500;
  color: #4a4a4a;
`;

const Value = styled.span`
  color: #1a1a1a;
  font-weight: 500;
`;

const NetworkBadge = styled.span`
  display: inline-block;
  padding: 0.25rem 0.5rem;
  background-color: #e3f2fd;
  color: #1976d2;
  border-radius: 4px;
  font-size: 0.75rem;
  font-weight: 500;
`;

const Button = styled.button<{ variant?: 'success' | 'danger' }>`
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 500;
  transition: all 0.2s ease;
  background-color: #2196F3;
  color: white;
  font-size: 0.95rem;
  
  &:hover {
    background-color: #1976d2;
    transform: translateY(-1px);
  }

  &:disabled {
    background-color: #e0e0e0;
    cursor: not-allowed;
    transform: none;
  }
`;

const Loading = styled.div`
  text-align: center;
  padding: 2rem;
  color: #666;
`;

const CopyButton = styled.button`
  background: none;
  border: none;
  cursor: pointer;
  padding: 0.25rem 0.5rem;
  margin-left: 0.5rem;
  color: #2196F3;
  font-size: 0.875rem;
  border-radius: 4px;
  transition: background-color 0.2s ease;
  
  &:hover {
    background-color: rgba(33, 150, 243, 0.1);
  }
`;

const WalletAddress = styled.div`
  display: flex;
  align-items: center;
  font-family: monospace;
  font-size: 0.875rem;
  word-break: break-all;
  cursor: pointer;
  padding: 0.5rem;
  background: #f5f5f5;
  border-radius: 4px;
  transition: background-color 0.2s ease;
  
  &:hover {
    background-color: #e0e0e0;
  }
`;

const NoGoals = styled.div`
  text-align: center;
  padding: 2rem;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  
  p {
    margin-bottom: 1rem;
    color: #666;
  }
`;

const getStatusColor = (status: GoalStatus): string => {
  switch (status) {
    case GoalStatus.PENDING:
      return '#9e9e9e'; // Grey
    case GoalStatus.FUNDED:
      return '#ff9800'; // Orange
    case GoalStatus.ACTIVE:
      return '#2196F3'; // Blue
    case GoalStatus.COMPLETED:
      return '#4CAF50'; // Green
    case GoalStatus.FAILED:
      return '#f44336'; // Red
    default:
      return '#2196F3';
  }
};

const getStatusLabel = (status: GoalStatus): string => {
  switch (status) {
    case GoalStatus.PENDING:
      return 'Awaiting Funds';
    case GoalStatus.FUNDED:
      return 'Ready to Publish';
    case GoalStatus.ACTIVE:
      return 'In Progress';
    case GoalStatus.COMPLETED:
      return 'Completed';
    case GoalStatus.FAILED:
      return 'Failed';
    default:
      return status;
  }
};

// Add a StatusBadge component for better status visibility
const StatusBadge = styled.span<{ status: GoalStatus }>`
  display: inline-block;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  font-size: 0.75rem;
  font-weight: 500;
  background-color: ${props => getStatusColor(props.status)};
  color: white;
`;

// Function to convert public key to Ethereum address
const publicKeyToAddress = (publicKey: string): string => {
  try {
    if (publicKey.startsWith('04')) {
      const cleanPublicKey = publicKey.slice(2);
      const addressBuffer = ethers.keccak256('0x' + cleanPublicKey);
      const ethereumAddress = '0x' + addressBuffer.slice(-40);
      return ethers.getAddress(ethereumAddress); // Returns checksummed address
    }
    return publicKey; // Return as is if not an uncompressed public key
  } catch (e) {
    console.error('Error converting public key to address:', e);
    return publicKey;
  }
};

const formatWalletAddress = (publicKey: string, network?: WalletNetwork) => {
  const address = publicKeyToAddress(publicKey);
  if (address.length <= 10) return address;
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
};

const getNetworkSymbol = (network?: WalletNetwork): string => {
  if (!network) return 'ETH';
  
  switch (network) {
    case WalletNetwork.BSC:
      return 'BNB';
    case WalletNetwork.POLYGON:
      return 'MATIC';
    case WalletNetwork.SOLANA:
      return 'SOL';
    case WalletNetwork.BITCOIN:
      return 'BTC';
    case WalletNetwork.TRC20:
      return 'TRX';
    case WalletNetwork.METIS:
      return 'METIS';
    case WalletNetwork.ERC20:
    case WalletNetwork.ARBITRUM:
    case WalletNetwork.OPTIMISM:
      return 'ETH';
    default:
      return 'ETH';
  }
};

const BalanceInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const BalanceValue = styled.span`
  font-family: monospace;
  font-weight: 600;
  color: #1a1a1a;
`;

const UpdateButton = styled(Button)`
  padding: 0.5rem 1rem;
  font-size: 0.875rem;
  background-color: #f5f5f5;
  color: #666;
  
  &:hover {
    background-color: #e0e0e0;
  }
`;

const CardFooter = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 1.5rem;
  padding-top: 1rem;
  border-top: 1px solid #eee;
`;

const MyGoals: React.FC = () => {
  const navigate = useNavigate();
  const { myGoals, isLoading, refetchMyGoals } = useGoals();
  const [goals, setGoals] = useState<GoalWithWallet[]>([]);
  const [copiedAddress, setCopiedAddress] = useState<string | null>(null);

  useEffect(() => {
    const token = localStorage.getItem(TOKEN_KEY);
    if (!token) {
      navigate('/');
      return;
    }

    refetchMyGoals();
  }, [navigate, refetchMyGoals]);

  useEffect(() => {
    if (myGoals) {
      setGoals(myGoals);
    }
  }, [myGoals]);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedAddress(text);
      setTimeout(() => setCopiedAddress(null), 2000);
    });
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (isLoading) {
    return <Loading>Loading your goals...</Loading>;
  }

  return (
    <Container>
      <Title>My Goals</Title>
      
      {!goals.length ? (
        <NoGoals>
          <p>You don't have any goals yet.</p>
          <Button onClick={() => navigate('/')}>Create a New Goal</Button>
        </NoGoals>
      ) : (
        <GoalsList>
          {goals.map(goal => (
            <GoalListItem key={goal.id} status={goal.status} onClick={() => navigate(`/goals/${goal.id}/info`)}>
              <GoalHeader>
                <GoalTitle>{goal.title}</GoalTitle>
                <StatusBadge status={goal.status}>
                  {getStatusLabel(goal.status)}
                </StatusBadge>
              </GoalHeader>
              <GoalContent>
                <GoalInfo>
                  <InfoRow>
                    <Label>Deadline:</Label>
                    <Value>{formatDate(goal.deadline)}</Value>
                  </InfoRow>
                </GoalInfo>
              </GoalContent>
            </GoalListItem>
          ))}
        </GoalsList>
      )}
    </Container>
  );
};

export default MyGoals;
