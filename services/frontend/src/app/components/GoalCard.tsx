import React from 'react';
import styled from 'styled-components';
import { GoalWithWallet } from '../../types/goals';
import { config } from '@/config';

const Card = styled.div`
  background: #ffffff;
  border-radius: 10px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  transition: all 0.2s ease;
  border: 1px solid rgba(0, 0, 0, 0.05);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  min-height: 340px;
  padding: 0; // Remove default padding for more space
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 24px rgba(33, 150, 243, 0.15);
  }
`;

const CardImage = styled.div`
  width: 100%;
  height: 180px;
  overflow: hidden;
  background: #f5f5f5;
  position: relative;
  cursor: pointer;
  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    position: absolute;
    top: 0;
    left: 0;
  }
`;

const CardContent = styled.div`
  padding: 0.7rem 1rem 1rem 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`;

const CardTitle = styled.h2`
  font-size: 1.5rem;
  margin-bottom: 0.5rem;
  color: #1a1a1a;
  font-weight: 600;
  line-height: 1.2;
  cursor: pointer;
  transition: color 0.2s ease;
  &:hover {
    color: #2196F3;
  }
`;

const CardItem = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.3rem 0;
  background: none;
  border-radius: 4px;
`;

const Label = styled.span`
  font-weight: 500;
  color: #666;
  font-size: 0.82rem;
`;

const Value = styled.span`
  color: #1a1a1a;
  font-size: 0.82rem;
`;

const UserAddress = styled.span`
  font-family: 'Roboto Mono', monospace;
  font-size: 0.78rem;
  color: #666;
  display: flex;
  align-items: center;
  background: rgba(0, 0, 0, 0.01);
  padding: 0.2rem 0.4rem;
  border-radius: 3px;
`;

const CopyButton = styled.button`
  background: rgba(33, 150, 243, 0.08);
  border: none;
  color: #2196F3;
  cursor: pointer;
  font-size: 0.7rem;
  margin-left: 0.3rem;
  padding: 2px 5px;
  border-radius: 2px;
  transition: all 0.2s;
  &:hover {
    background: rgba(33, 150, 243, 0.16);
  }
  &:active {
    transform: scale(0.97);
  }
`;

// Material color palette for categories
const categoryColors: Record<string, string> = {
  EDUCATION: '#3F51B5', // Indigo
  HEALTH: '#E91E63', // Pink
  CAREER: '#009688', // Teal
  FINANCE: '#FFC107', // Amber
  PERSONAL: '#8BC34A', // Light Green
  HOBBIES: '#FF9800', // Orange
  RELATIONSHIPS: '#9C27B0', // Purple
  TRAVEL: '#2196F3', // Blue
  OTHER: '#607D8B', // Blue Grey
};

function getCategoryColor(category: string) {
  return categoryColors[category?.toUpperCase()] || '#BDBDBD'; // Default: Grey
}

const CategoryBadge = styled.span<{ bgcolor: string }>`
  display: inline-block;
  padding: 0.25rem 0.6rem;
  background: ${({ bgcolor }) => bgcolor};
  color: white;
  border-radius: 50px;
  font-size: 0.75rem;
  font-weight: 500;
  box-shadow: 0 1px 3px rgba(33, 150, 243, 0.10);
`;

const Balance = styled.span`
  font-weight: 600;
  color: #4caf50;
  font-size: 0.9rem;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.08);
  background: rgba(76, 175, 80, 0.08);
  padding: 0.25rem 0.6rem;
  border-radius: 10px;
`;

const CategoryBalanceContainer = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 0.5rem;
`;

const ViewButton = styled.button`
  background: linear-gradient(45deg, #2196F3, #00BCD4);
  color: white;
  border: none;
  padding: 1rem;
  border-radius: 7px;
  font-weight: 500;
  cursor: pointer;
  width: 100%;
  margin-top: 0.7rem;
  transition: all 0.2s ease;
  font-size: 0.85rem;
  box-shadow: 0 2px 8px rgba(33, 150, 243, 0.10);
  &:hover {
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(33, 150, 243, 0.13);
  }
  &:active {
    transform: translateY(0);
  }
`;

// Progress bar for createdAt to deadline
const ProgressBarContainer = styled.div`
  width: 100%;
  height: 7px;
  background: #e0e0e0;
  border-radius: 4px;
  margin: 0.5rem 0 0 0;
  overflow: hidden;
`;
const Progress = styled.div<{ percent: number }>`
  height: 100%;
  background: ${({ percent }) => {
    if (percent < 10) return '#4FC3F7'; // solid blue for <10%
    if (percent < 50) return 'linear-gradient(90deg, #4FC3F7 0%, #4CAF50 100%)'; // blue to green for 10-50%
    return 'linear-gradient(90deg, #4FC3F7 0%, #FFA500 100%)'; // blue to orange for >=50%
  }};
  width: ${({ percent }) => percent}%;
  transition: width 0.4s;
  position: relative;
  &::after {
    content: '';
    position: absolute;
    top: 0;
    right: 0;
    height: 100%;
    width: ${({ percent }) => 100 - percent}%;
    background: transparent;
  }
`;

interface GoalCardProps {
  goal: GoalWithWallet;
  usdBalance: string;
  formattedAddress: string;
  copiedAddress: string;
  onCopy: (address: string) => void;
  onViewDetails: (goalId: number) => void;
}

function getProgressPercent(createdAt: string | Date, deadline: string | Date) {
  const now = Date.now();
  const start = new Date(createdAt).getTime();
  const end = new Date(deadline).getTime();
  if (end <= start) return 100;
  if (now <= start) return 0;
  if (now >= end) return 100;
  return ((now - start) / (end - start)) * 100;
}

const GoalCard: React.FC<GoalCardProps> = ({
  goal,
  usdBalance,
  formattedAddress,
  copiedAddress,
  onCopy,
  onViewDetails,
}) => {
  const userAddress = goal.user?.address || '';
  // Use goal.createdAt if present, otherwise fallback to first wallet's createdAt
  const createdAt = (goal as any).createdAt || goal.wallets[0]?.createdAt;
  const progressPercent = createdAt ? getProgressPercent(createdAt, goal.deadline) : 100;
  return (
    <Card>
      <CardImage onClick={() => onViewDetails(goal.id)}>
        <img
          src={goal.image ? `${config.backendUrl}/${goal.image}` : '/assets/DefaultGoal.jpg'}
          alt={goal.title}
          onError={(e) => {
            const target = e.target as HTMLImageElement;
            if (!target.dataset.fallback) {
              target.dataset.fallback = 'true';
              target.src = '/assets/DefaultGoal.jpg';
            } else {
              target.style.display = 'none';
            }
          }}
        />
      </CardImage>
      <CardContent>
        <CardTitle onClick={() => onViewDetails(goal.id)}>{goal.title}</CardTitle>
        <ProgressBarContainer>
          <Progress percent={progressPercent} />
        </ProgressBarContainer>
        <CardItem>
          <Label>Deadline:</Label>
          <Value>{new Date(goal.deadline).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}</Value>
        </CardItem>
        <CardItem>
          <CategoryBalanceContainer>
            <CategoryBadge bgcolor={getCategoryColor(goal.category)}>{goal.category}</CategoryBadge>
            <Balance>${usdBalance}</Balance>
          </CategoryBalanceContainer>
        </CardItem>
      </CardContent>
    </Card>
  );
};

export default GoalCard; 