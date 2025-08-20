import React from 'react';
import Link from 'next/link';
import styles from './page.module.css';
import { fetchGoalById, fetchSharedGoal } from '../../api/goals';
import { GoalDetailClient } from '../../components/GoalDetailClient';
import { PublicGoal } from '../../types/public-api';
import ReactMarkdown from 'react-markdown';
import { UserAvatar } from '../../components/UserAvatar';
import { formatImageUrl } from '../../utils/image';
import { SocialShare } from '../../components/SocialShare';
import { Metadata } from 'next';

const formatDate = (date: string) => {
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};

// Helper function to determine if the ID is a share token or goal ID
const isShareToken = (id: string): boolean => {
  // Share tokens are 32-character hex strings, goal IDs are numbers
  return !/^\d+$/.test(id);
};

const getStatusLabel = (status: string) => {
  switch (status) {
    case 'active':
      return 'In Progress';
    case 'completed':
      return 'Completed';
    case 'failed':
      return 'Failed';
    default:
      return status;
  }
};

// Tasks Card Component (moved from GoalDetailClient)
interface TasksCardProps {
  tasks: PublicGoal['tasks'];
}

const TasksCard: React.FC<TasksCardProps> = ({ tasks }) => {
  if (!tasks || tasks.length === 0) return null;

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getPriorityColor = (priority: string) => {
    switch (priority?.toLowerCase()) {
      case 'high': return '#f44336';
      case 'medium': return '#ff9800';
      case 'low': return '#4caf50';
      default: return '#9e9e9e';
    }
  };

  return (
    <div className={styles.card}>
      <div className={styles.cardContent}>
        <h2 className={styles.sectionTitle}>Completed Tasks ({tasks.length})</h2>
        
        <div className={styles.tasksList}>
          {tasks.map((task) => (
            <div key={task.id} className={styles.taskItem}>
              <div className={styles.taskHeader}>
                <h4 className={styles.taskTitle}>{task.title}</h4>
                <div className={styles.taskMeta}>
                  <span 
                    className={styles.priorityBadge}
                    style={{ backgroundColor: getPriorityColor(task.priority) }}
                  >
                    {task.priority}
                  </span>
                  <span className={styles.taskStatus}>✓ COMPLETED</span>
                </div>
              </div>
              
              {task.description && (
                <p className={styles.taskDescription}>{task.description}</p>
              )}
              
              <div className={styles.taskFooter}>
                <span className={styles.taskDate}>
                  Completed: {formatDate(task.updatedAt)}
                </span>
                {task.deadline && (
                  <span className={styles.taskDeadline}>
                    Deadline: {formatDate(task.deadline)}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// Generate metadata for social sharing
export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  const isShared = isShareToken(params.id);
  
  try {
    const goal = isShared 
      ? await fetchSharedGoal(params.id)
      : await fetchGoalById(params.id);
    
    if (!goal) {
      return {
        title: isShared ? 'Shared goal not found' : 'Goal not found',
        description: isShared 
          ? 'The shared goal could not be found or the link is invalid.'
          : 'The requested goal could not be found.',
      };
    }

    const imageUrl = formatImageUrl(goal.image);
    const pageUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'https://myodyssey.me'}/goals/${params.id}`;
    const titlePrefix = isShared ? `${goal.title} - Shared Goal` : goal.title;
    
    return {
      title: `${titlePrefix} - MyOdyssey`,
      description: goal.description,
      openGraph: {
        title: titlePrefix,
        description: goal.description,
        url: pageUrl,
        siteName: 'MyOdyssey',
        images: imageUrl ? [
          {
            url: imageUrl,
            width: 1200,
            height: 630,
            alt: goal.title,
          }
        ] : [],
        locale: 'en_US',
        type: 'website',
      },
      twitter: {
        card: 'summary_large_image',
        title: titlePrefix,
        description: goal.description,
        images: imageUrl ? [imageUrl] : [],
      },
      robots: {
        index: !isShared, // Don't index shared goals
        follow: !isShared,
      },
    };
  } catch (error) {
    return {
      title: isShared ? 'Shared goal not found' : 'Goal not found',
      description: isShared 
        ? 'The shared goal could not be found or the link is invalid.'
        : 'The requested goal could not be found.',
    };
  }
}

export default async function GoalDetailPage({ params }: { params: { id: string } }) {
  const isShared = isShareToken(params.id);
  
  let goal: PublicGoal;
  try {
    goal = isShared 
      ? await fetchSharedGoal(params.id)
      : await fetchGoalById(params.id);
  } catch (error) {
    return (
      <div className={styles.container}>
        <Link href="/" className={styles.goBackButton}>
          ← Back to Goals
        </Link>
        <div className={styles.error}>
          <h2>{isShared ? 'Shared Goal Not Found' : 'Error'}</h2>
          <p>{isShared ? 'The shared goal link is invalid or has been revoked.' : 'Goal not found'}</p>
        </div>
      </div>
    );
  }
  // Transform GoalWithWallet to PublicGoal
  const publicGoal: PublicGoal = {
    ...goal,
    wallets: goal.wallets.map(wallet => ({
      ...wallet,
      exchangeRate: 0,
      lastBalance: wallet.lastBalance || '0',
      lastBalanceUpdate: wallet.lastBalanceUpdate?.toString() || new Date().toISOString(),
      publicKey: wallet.publicKey,
      createdAt: wallet.createdAt?.toString() || new Date().toISOString()
    }))
  };

  const imageUrl = formatImageUrl(goal.image);
  
  return (
    <>
      <div className={styles.breadcrumbs}>
        <Link href="/" className={styles.breadcrumbLink}>
          Goals
        </Link>
        <span className={styles.breadcrumbSeparator}>/</span>
        <span className={styles.breadcrumbCurrent}>
          {isShared ? `Shared: ${goal.title}` : goal.title}
        </span>
      </div>

      <div className={styles.container}>
        <div className={styles.leftContent}>
          <div className={styles.card}>
            {imageUrl && (
              <div 
                className={styles.thumbnailWrapper}
                style={{ backgroundImage: `url(${imageUrl})` }}
              />
            )}
            <div className={styles.cardContent}>
              <h1 className={styles.title}>{goal.title}</h1>
              
              <div className={styles.statuses}>
                <span className={`${styles.statusBadge} ${styles[goal.status]}`}>
                  {getStatusLabel(goal.status)}
                </span>
                <span className={styles.categoryBadge}>{goal.category}</span>
                {isShared && (
                  <span className={styles.sharedBadge}>📤 Shared Goal</span>
                )}
              </div>
              
              <div className={styles.infoRow}>
                <span className={styles.label}>Deadline:</span>
                <span className={styles.value}>{formatDate(goal.deadline)}</span>
              </div>
              
              <div className={styles.infoRow}>
                <span className={styles.label}>Total Balance:</span>
                <span className={styles.value}>
                  {goal.totalUsdBalance} $
                </span>
              </div>
            </div>
          </div>

          <div className={styles.card}>
            <div className={styles.cardContent}>
              <h2 className={styles.sectionTitle}>Description</h2>
              <div className={styles.markdownContent}>
                <ReactMarkdown>{goal.description}</ReactMarkdown>
              </div>
            </div>
          </div>

          {/* Tasks Card moved to left side */}
          <TasksCard tasks={publicGoal.tasks} />

          {/* Social Share moved inside left content */}
          <SocialShare 
            title={isShared ? `Shared Goal: ${goal.title}` : goal.title}
            description={goal.description}
            imageUrl={imageUrl}
          />

          {goal.user && (
            <div className={styles.card}>
              <div className={styles.cardContent}>
                <h2 className={styles.sectionTitle}>Created by</h2>
                <div className={styles.userInfo}>
                  <UserAvatar 
                    avatarUrl={goal.user.profile?.avatar}
                    username={goal.user.profile?.username}
                  />
                  <div>
                    <div className={styles.userName}>{goal.user.profile?.username || 'Anonymous'}</div>
                    {goal.user.profile?.bio && (
                      <div className={styles.userBio}>
                        <ReactMarkdown>{goal.user.profile.bio}</ReactMarkdown>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
        
        <GoalDetailClient goal={publicGoal} />
      </div>
    </>
  );
} 