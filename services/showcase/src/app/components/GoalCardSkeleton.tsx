import styles from '../page.module.css';

export function GoalCardSkeleton() {
  return (
    <div className={styles.goalCard}>
      <div 
        style={{
          width: '100%',
          height: '180px',
          backgroundColor: '#f0f0f0',
          position: 'relative',
          overflow: 'hidden'
        }}
      >
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: '-100%',
            width: '100%',
            height: '100%',
            background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent)',
            animation: 'shimmer 1.5s infinite'
          }}
        />
      </div>
      
      <div className={styles.goalContent}>
        <div
          style={{
            height: '24px',
            backgroundColor: '#f0f0f0',
            borderRadius: '4px',
            marginBottom: '8px',
            width: '80%',
            position: 'relative',
            overflow: 'hidden'
          }}
        >
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: '-100%',
              width: '100%',
              height: '100%',
              background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent)',
              animation: 'shimmer 1.5s infinite'
            }}
          />
        </div>
        
        {/* Skeleton for description */}
        <div
          style={{
            height: '16px',
            backgroundColor: '#f0f0f0',
            borderRadius: '4px',
            marginBottom: '8px',
            width: '100%',
            position: 'relative',
            overflow: 'hidden'
          }}
        >
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: '-100%',
              width: '100%',
              height: '100%',
              background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent)',
              animation: 'shimmer 1.5s infinite'
            }}
          />
        </div>
        <div
          style={{
            height: '16px',
            backgroundColor: '#f0f0f0',
            borderRadius: '4px',
            marginBottom: '8px',
            width: '90%',
            position: 'relative',
            overflow: 'hidden'
          }}
        >
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: '-100%',
              width: '100%',
              height: '100%',
              background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent)',
              animation: 'shimmer 1.5s infinite'
            }}
          />
        </div>
        
        {/* Skeleton for meta info */}
        <div className={styles.goalMeta}>
          {/* Skeleton for category */}
          <div
            style={{
              height: '24px',
              backgroundColor: '#f0f0f0',
              borderRadius: '12px',
              width: '80px',
              position: 'relative',
              overflow: 'hidden'
            }}
          >
            <div
              style={{
                position: 'absolute',
                top: 0,
                left: '-100%',
                width: '100%',
                height: '100%',
                background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent)',
                animation: 'shimmer 1.5s infinite'
              }}
            />
          </div>
          
          {/* Skeleton for status */}
          <div
            style={{
              height: '24px',
              backgroundColor: '#f0f0f0',
              borderRadius: '12px',
              width: '60px',
              position: 'relative',
              overflow: 'hidden'
            }}
          >
            <div
              style={{
                position: 'absolute',
                top: 0,
                left: '-100%',
                width: '100%',
                height: '100%',
                background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent)',
                animation: 'shimmer 1.5s infinite'
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
} 