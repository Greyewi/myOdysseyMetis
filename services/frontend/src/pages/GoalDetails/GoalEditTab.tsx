import React, { useState } from 'react';
import styled from 'styled-components';
import { GoalWithWallet } from '../../types/goals';
import GoalEditForm from './GoalEditForm';
import { config } from '../../config';
import { updateGoal } from '../../app/api/goals';
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

interface GoalEditTabProps {
  goal: GoalWithWallet;
  onGoalUpdate: () => void;
  onTabChange: (tab: 'info' | 'ai-evaluation' | 'wallets' | 'tasks' | 'edit') => void;
}

const GoalEditTab: React.FC<GoalEditTabProps> = ({
  goal,
  onGoalUpdate,
  onTabChange
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [error, setError] = useState<string | null>(null);

  return (
    <TabContent isMobile={isMobile}>
      <GoalEditForm
        initialData={{
          title: goal.title,
          description: goal.description,
          status: goal.status,
          category: goal.category,
          image: goal.image,
          weeklyTimeCommitment: goal.weeklyTimeCommitment,
          currentExperience: goal.currentExperience,
          availableResources: goal.availableResources,
          startingPoint: goal.startingPoint
        }}
        difficulty={goal.difficulty}
        error={error || undefined}
        onSubmit={async (data) => {
          try {
            setError(null); // Clear any previous errors
            console.log('Form submitted with data:', data);
            
            // Prepare the update data, filtering out unchanged values
            const updateData: any = {};
            
            if (data.title !== goal.title) {
              updateData.title = data.title;
            }
            if (data.description !== goal.description) {
              updateData.description = data.description;
            }
            if (data.category !== goal.category) {
              updateData.category = data.category;
            }
            if (data.weeklyTimeCommitment !== goal.weeklyTimeCommitment) {
              updateData.weeklyTimeCommitment = data.weeklyTimeCommitment;
            }
            if (data.currentExperience !== goal.currentExperience) {
              updateData.currentExperience = data.currentExperience;
            }
            if (data.availableResources !== goal.availableResources) {
              updateData.availableResources = data.availableResources;
            }
            if (data.startingPoint !== goal.startingPoint) {
              updateData.startingPoint = data.startingPoint;
            }

            // Handle image update separately if it's a File
            if (data.image instanceof File) {
              const formData = new FormData();
              Object.keys(updateData).forEach(key => {
                formData.append(key, updateData[key]);
              });
              formData.append('image', data.image);

              // Use fetch API for file upload
              const token = localStorage.getItem('cryptogoals_auth_token');
              const response = await fetch(`${config.apiUrl}/goals/${goal.id}`, {
                method: 'PATCH',
                headers: {
                  'Authorization': `Bearer ${token}`,
                },
                body: formData,
              });

              if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to update goal');
              }
            } else {
              // Use the API function for regular updates
              await updateGoal(goal.id, updateData);
            }

            // Switch back to info tab and refresh goal data
            onTabChange('info');
            onGoalUpdate();
            
            console.log('Goal updated successfully');
          } catch (error) {
            console.error('Failed to update goal:', error);
            setError(error instanceof Error ? error.message : 'Unknown error');
          }
        }}
        onCancel={() => {
          // Optionally switch back to info tab when cancelled
          onTabChange('info');
        }}
        goalId={goal.id}
      />
    </TabContent>
  );
};

export default GoalEditTab; 