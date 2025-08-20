'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { PublicGoal } from '../types/public-api';
import styles from './GoalCard.module.css';
import { formatImageUrl } from '../utils/image';

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

// Helper function to get difficulty level and color
function getDifficultyInfo(achievabilityScore: number | undefined): { level: string; color: string } | null {
  if (achievabilityScore === undefined) return null;
  
  // Convert to percentage (0-1 to 0-100)
  const percentage = achievabilityScore * 100;
  
  if (percentage < 30) {
    return { level: 'HARD', color: '#f44336' }; // Red
  } else if (percentage > 70) {
    return { level: 'EASY', color: '#4CAF50' }; // Green
  } else {
    return { level: 'MEDIUM', color: '#FF9800' }; // Orange
  }
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

// Helper function to format currency
function formatCurrency(amount: string | number): string {
  const numericAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(numericAmount);
}

interface GoalCardProps {
  goal: PublicGoal;
}

export function GoalCard({ goal }: GoalCardProps) {
  const [imageError, setImageError] = React.useState(false);
  const formattedImageUrl = formatImageUrl(goal.image);
  const progressPercent = React.useMemo(() => {
    return Number(getProgressPercent(goal.createdAt, goal.deadline).toFixed(2));
  }, [goal.deadline, goal.createdAt]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  const difficultyInfo = getDifficultyInfo(goal.evaluation?.achievabilityScore);

  return (
    <div className={styles.card}>
      <Link href={`/goals/${goal.id}`} className={styles.imageContainer}>
        <Image
          src={formattedImageUrl && !imageError ? formattedImageUrl : '/DefaultGoal.jpg'}
          alt={goal.title}
          fill
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          className={
            formattedImageUrl && !imageError
              ? styles.image
              : `${styles.image} ${styles.defaultImage}`
          }
          onError={() => setImageError(true)}
        />
      </Link>
      <div className={styles.content}>
        <div className={styles.titleRow}>
          <Link href={`/goals/${goal.id}`} className={styles.title}>
            {goal.title}
          </Link>
          {difficultyInfo && (
            <span 
              className={styles.difficultyBadge}
              style={{ backgroundColor: difficultyInfo.color }}
            >
              {difficultyInfo.level}
            </span>
          )}
        </div>
        <div className={styles.progressBar}>
          <div 
            className={styles.progress} 
            style={{ 
              width: `${progressPercent}%`,
              background: progressPercent < 10 ? '#4FC3F7' :
                         progressPercent < 50 ? 'linear-gradient(90deg, #4FC3F7 0%, #4CAF50 100%)' :
                         'linear-gradient(90deg, #4FC3F7 0%, #FFA500 100%)'
            }}
          />
        </div>
        <div className={styles.meta}>
          <div className={styles.deadline}>
            <span className={styles.label}>Deadline:</span>
            <span className={styles.value}>
              {new Date(goal.deadline).toLocaleDateString('en-US', { 
                year: 'numeric', 
                month: 'short', 
                day: 'numeric' 
              })}
            </span>
          </div>
          <div className={styles.categoryBalance}>
            <span 
              className={styles.category}
              style={{ backgroundColor: getCategoryColor(goal.category) }}
            >
              {goal.category}
            </span>
            <span className={styles.balance}>{formatCurrency(Number(goal.totalUsdBalance))}</span>
          </div>
        </div>
      </div>
    </div>
  );
} 