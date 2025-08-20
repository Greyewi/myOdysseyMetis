'use client';

import React from 'react';
import Select from 'rc-select';
import 'rc-select/assets/index.css';
import styles from './GoalFilters.module.css';

interface GoalFiltersProps {
  currentSort: 'deadline_asc' | 'deadline_desc' | 'funded_desc' | 'funded_asc' | '';
  currentCategory: string;
  currentNetwork: string;
  onFilterChange: (type: 'sort' | 'category' | 'network', value: string) => void;
}

const sortOptions = [
  { value: '', label: 'Clear Sorting' },
  { value: 'deadline_desc', label: 'Deadline: Latest First' },
  { value: 'deadline_asc', label: 'Deadline: Earliest First' },
  { value: 'funded_desc', label: 'Most Funded First' },
  { value: 'funded_asc', label: 'Least Funded First' }
];

const categoryOptions = [
  { value: '', label: 'All Categories' },
  { value: 'EDUCATION', label: 'Education' },
  { value: 'HEALTH', label: 'Health' },
  { value: 'CAREER', label: 'Career' },
  { value: 'FINANCE', label: 'Finance' },
  { value: 'PERSONAL', label: 'Personal' },
  { value: 'HOBBIES', label: 'Hobbies' },
  { value: 'RELATIONSHIPS', label: 'Relationships' },
  { value: 'TRAVEL', label: 'Travel' },
  { value: 'OTHER', label: 'Other' }
];

export function GoalFilters({ 
  currentSort, 
  currentCategory, 
  currentNetwork, // keep for props compatibility
  onFilterChange 
}: GoalFiltersProps) {
  const handleFilterChange = (type: 'sort' | 'category', value: string) => {
    switch (type) {
      case 'sort':
        onFilterChange(type, value as 'deadline_asc' | 'deadline_desc' | 'funded_asc' | 'funded_desc' | '');
        break;
      case 'category':
        onFilterChange(type, value);
        break;
    }
  };

  return (
    <div className={styles.filters}>
      <div className={styles.filterGroup}>
        <label className={styles.label}>Sort By</label>
        <Select
          className={styles.select}
          value={currentSort}
          onChange={(value) => handleFilterChange('sort', value)}
          options={sortOptions}
          dropdownStyle={{ zIndex: 1000 }}
          menuItemSelectedIcon={null}
          suffixIcon={
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M2.5 4.5L6 8L9.5 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          }
          dropdownClassName={styles.dropdown}
          showSearch={false}
          virtual={false}
        />
      </div>

      <div className={styles.filterGroup}>
        <label className={styles.label}>Category</label>
        <Select
          className={styles.select}
          value={currentCategory}
          onChange={(value) => handleFilterChange('category', value)}
          options={categoryOptions}
          dropdownStyle={{ zIndex: 1000 }}
          menuItemSelectedIcon={null}
          suffixIcon={
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M2.5 4.5L6 8L9.5 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          }
          dropdownClassName={styles.dropdown}
          showSearch={false}
          virtual={false}
        />
      </div>
    </div>
  );
} 