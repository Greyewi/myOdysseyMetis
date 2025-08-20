import React from 'react';
import styled from 'styled-components';
import { GoalWithWallet } from '../../types/goals';
import WalletManagement from '../../components/WalletManagement/WalletManagement';
import { useTheme, useMediaQuery } from '@mui/material';

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

interface GoalWalletsTabProps {
  goal: GoalWithWallet;
  onGoalUpdate: () => void;
}

const GoalWalletsTab: React.FC<GoalWalletsTabProps> = ({
  goal,
  onGoalUpdate
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  return (
    <TabContent isMobile={isMobile}>
      <WalletManagement
        goal={goal}
        onGoalUpdate={onGoalUpdate}
      />
    </TabContent>
  );
};

export default GoalWalletsTab; 