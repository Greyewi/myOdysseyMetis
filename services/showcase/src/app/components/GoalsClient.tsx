'use client';

import { useState, useEffect } from 'react';
import { GoalCard } from './GoalCard';
import { GoalFilters } from './GoalFilters';
import { GoalPagination } from './GoalPagination';
import { GoalCardSkeleton } from './GoalCardSkeleton';
import styles from '../page.module.css';
import { PublicGoal } from '../types/public-api';

interface GoalsClientProps {
  initialGoals?: PublicGoal[];
  initialFilteredGoals?: PublicGoal[];
  initialPage?: number;
  initialSort?: 'deadline_asc' | 'deadline_desc' | 'funded_asc' | 'funded_desc';
  initialCategory?: string;
  initialNetwork?: string;
  initialTotalPages?: number;
}

export function GoalsClient({
  initialGoals = [],
  initialFilteredGoals = [],
  initialPage = 1,
  initialSort = 'deadline_asc',
  initialCategory = '',
  initialNetwork = 'METIS',
  initialTotalPages = 1
}: GoalsClientProps) {
  const [goals, setGoals] = useState<PublicGoal[]>([]);
  const [currentPage, setCurrentPage] = useState(initialPage);
  const [currentSort, setCurrentSort] = useState(initialSort);
  const [currentCategory, setCurrentCategory] = useState(initialCategory);
  // Remove currentNetwork state, always use 'METIS'
  const currentNetwork = 'METIS';
  const [totalPages, setTotalPages] = useState(initialTotalPages);
  const [isLoading, setIsLoading] = useState(true); // Start with loading true
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  const fetchGoals = async () => {
    setIsLoading(true);
    try {
      const queryParams = new URLSearchParams({
        page: currentPage.toString(),
        ...(currentSort ? (currentSort.startsWith('deadline') ? {
          sortField: 'deadline',
          sortDirection: currentSort === 'deadline_asc' ? 'asc' : 'desc'
        } : {
          sortField: 'totalUsdBalance',
          sortDirection: currentSort === 'funded_asc' ? 'asc' : 'desc'
        }) : {}),
        ...(currentCategory && { category: currentCategory }),
        network: 'METIS'
      });

      const response = await fetch(`/api/public-goals/all?${queryParams}`);
      if (!response.ok) {
        throw new Error('Failed to fetch goals');
      }
      const data = await response.json();
      setGoals(data);
      setTotalPages(Math.ceil(data.length / 10)); // Assuming 10 items per page
    } catch (error) {
      console.error('Error fetching goals:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch goals on initial mount
  useEffect(() => {
    if (isInitialLoad) {
      fetchGoals();
      setIsInitialLoad(false);
    }
  }, []); // Empty dependency array for initial load only

  // Fetch goals when filters change (but not on initial load)
  useEffect(() => {
    if (!isInitialLoad) {
      fetchGoals();
    }
  }, [currentPage, currentSort, currentCategory]); // Remove currentNetwork from deps

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
    // Update URL without full page reload
    const url = new URL(window.location.href);
    url.searchParams.set('page', String(newPage));
    window.history.pushState({}, '', url.toString());
  };

  const handleFilterChange = (type: 'sort' | 'category', value: string) => {
    // Reset to page 1 when filters change
    setCurrentPage(1);
    switch (type) {
      case 'sort':
        setCurrentSort(value as 'deadline_asc' | 'deadline_desc' | 'funded_asc' | 'funded_desc');
        break;
      case 'category':
        setCurrentCategory(value);
        break;
    }
    // Update URL without full page reload
    const url = new URL(window.location.href);
    url.searchParams.set('page', '1');
    url.searchParams.set(type, value);
    window.history.pushState({}, '', url.toString());
  };

  return (
    <div className={styles.container}>
      <GoalFilters 
        currentSort={currentSort}
        currentCategory={currentCategory}
        currentNetwork={currentNetwork} // prop kept for compatibility, but not used
        onFilterChange={handleFilterChange}
      />

      {isLoading ? (
        <div className={styles.cardsGrid}>
          {Array.from({ length: 6 }).map((_, index) => (
            <GoalCardSkeleton key={index} />
          ))}
        </div>
      ) : (
        <div className={styles.cardsGrid}>
          {goals.map((goal) => (
            <GoalCard key={goal.id} goal={goal} />
          ))}
        </div>
      )}

      <GoalPagination 
        currentPage={currentPage}
        hasMore={currentPage < totalPages}
        onPageChange={handlePageChange}
      />
    </div>
  );
} 