'use client';

import styles from './GoalPagination.module.css';

interface GoalPaginationProps {
  currentPage: number;
  hasMore: boolean;
  onPageChange: (newPage: number) => void;
}

export function GoalPagination({ currentPage, hasMore, onPageChange }: GoalPaginationProps) {
  return (
    <div className={styles.pagination}>
      <button
        className={styles.pageButton}
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage <= 1}
      >
        Previous
      </button>
      <span className={styles.pageInfo}>Page {currentPage}</span>
      <button
        className={styles.pageButton}
        onClick={() => onPageChange(currentPage + 1)}
        disabled={!hasMore}
      >
        Next
      </button>
    </div>
  );
} 