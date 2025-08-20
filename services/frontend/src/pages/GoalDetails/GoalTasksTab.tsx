import React from 'react';
import styled from 'styled-components';
import TaskListComponent from './TaskList';
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

interface GoalTasksTabProps {
  goalId: number;
  goalDeadline: Date;
  onTabChange: (tab: 'ai-evaluation') => void;
}

const GoalTasksTab: React.FC<GoalTasksTabProps> = ({
  goalId,
  goalDeadline,
  onTabChange
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  return (
    <TabContent isMobile={isMobile}>
      <TaskListComponent 
        goalId={goalId} 
        goalDeadline={goalDeadline}
        onTabChange={onTabChange}
      />
    </TabContent>
  );
};

export default GoalTasksTab; 