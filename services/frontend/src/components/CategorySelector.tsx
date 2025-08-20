import React from 'react';
import styled from 'styled-components';
import { GoalCategory } from '../types/goals';

const CategoryGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 1rem;
`;

const CategoryCard = styled.div<{ selected: boolean }>`
  padding: 1.5rem;
  border-radius: 8px;
  background: ${props => props.selected ? '#e3f2fd' : '#f5f5f5'};
  border: 2px solid ${props => props.selected ? '#2196F3' : 'transparent'};
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    background: ${props => props.selected ? '#e3f2fd' : '#eeeeee'};
    transform: translateY(-2px);
  }
`;

const CategoryTitle = styled.h3`
  margin: 0 0 0.5rem 0;
  color: #333;
  font-size: 1.1rem;
`;

const CategoryDescription = styled.p`
  margin: 0;
  color: #666;
  font-size: 0.9rem;
  line-height: 1.4;
`;

const categoryOptions = [
  {
    value: GoalCategory.EDUCATION,
    label: 'Education',
    description: 'Goals related to learning new skills, studying, taking courses, or improving knowledge in specific subjects.'
  },
  {
    value: GoalCategory.HEALTH,
    label: 'Health',
    description: 'Goals focused on physical and mental well-being — such as exercise, sleep, healthy eating, or quitting bad habits.'
  },
  {
    value: GoalCategory.CAREER,
    label: 'Career',
    description: 'Goals for growing your professional life — job search, skill development, productivity, or launching projects.'
  },
  {
    value: GoalCategory.FINANCE,
    label: 'Finance',
    description: 'Goals for managing money — saving, budgeting, paying off debt, or building financial literacy.'
  },
  {
    value: GoalCategory.PERSONAL,
    label: 'Personal',
    description: 'Goals related to personal growth — building habits, improving mindset, self-care, or daily routines.'
  },
  {
    value: GoalCategory.HOBBIES,
    label: 'Hobbies',
    description: 'Creative or leisure goals — such as playing music, painting, writing, cooking, or any passion projects.'
  },
  {
    value: GoalCategory.RELATIONSHIPS,
    label: 'Relationships',
    description: 'Goals that strengthen connections — spending time with loved ones, improving communication, or making new friends.'
  },
  {
    value: GoalCategory.TRAVEL,
    label: 'Travel',
    description: 'Goals focused on exploration — planning trips, visiting new places, or experiencing different cultures.'
  },
  {
    value: GoalCategory.OTHER,
    label: 'Other',
    description: 'Any goals that don\'t fit into other categories — use this for custom or unique objectives.'
  }
];

interface CategorySelectorProps {
  value: GoalCategory;
  onChange: (category: GoalCategory) => void;
}

const CategorySelector: React.FC<CategorySelectorProps> = ({ value, onChange }) => {
  return (
    <CategoryGrid>
      {categoryOptions.map((category) => (
        <CategoryCard
          key={category.value}
          selected={value === category.value}
          onClick={() => onChange(category.value)}
        >
          <CategoryTitle>{category.label}</CategoryTitle>
          <CategoryDescription>{category.description}</CategoryDescription>
        </CategoryCard>
      ))}
    </CategoryGrid>
  );
};

export default CategorySelector; 