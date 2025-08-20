'use client';

import React, { useState, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import styles from '../goals/[id]/page.module.css';
import { PublicGoal } from '../types/public-api';
import { ethers } from 'ethers';

interface CopyButtonProps {
  text: string;
}

const CopyButton: React.FC<CopyButtonProps> = ({ text }) => {
  const [showNotification, setShowNotification] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setShowNotification(true);
      setTimeout(() => setShowNotification(false), 2000);
    } catch (err) {
      console.error('Failed to copy to clipboard:', err);
    }
  };

  return (
    <>
      <button className={styles.copyButton} onClick={handleCopy}>
        Copy Address
      </button>
      {showNotification && (
        <div className={styles.copyNotification}>
          Wallet address copied to clipboard!
        </div>
      )}
    </>
  );
};

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

interface EvaluationCardProps {
  evaluation: PublicGoal['evaluation'];
}

const EvaluationCard: React.FC<EvaluationCardProps> = ({ evaluation }) => {
  if (!evaluation) return null;

  const difficultyInfo = getDifficultyInfo(evaluation.achievabilityScore);
  const percentage = Math.round(evaluation.achievabilityScore * 100);

  // Helper function to format analysis details value
  const formatAnalysisValue = (value: any): string => {
    if (typeof value === 'object' && value !== null) {
      // Check if it's an object with score and explanation
      if ('explanation' in value) {
        return value.explanation;
      }
      // Otherwise, stringify it
      return JSON.stringify(value, null, 2);
    }
    return String(value);
  };

  return (
    <div className={styles.card}>
      <div className={styles.cardContent}>
        <h2 className={styles.sectionTitle}>AI Evaluation</h2>
        
        <div className={styles.evaluationHeader}>
          <div className={styles.achievabilityScore}>
            <span className={styles.scoreValue}>{percentage}%</span>
            <span className={styles.scoreLabel}>Achievability</span>
          </div>
          {difficultyInfo && (
            <span 
              className={styles.difficultyBadgeLarge}
              style={{ backgroundColor: difficultyInfo.color }}
            >
              {difficultyInfo.level}
            </span>
          )}
        </div>

        <div className={styles.evaluationSummary}>
          <h3>Summary</h3>
          <p>{evaluation.summary}</p>
        </div>

        {evaluation.analysisDetails && typeof evaluation.analysisDetails === 'object' && (
          <div className={styles.analysisDetails}>
            <h3>Analysis Details</h3>
            <div className={styles.detailsGrid}>
              {Object.entries(evaluation.analysisDetails).map(([key, value]) => (
                <div key={key} className={styles.detailItem}>
                  <strong className={styles.detailKey}>{key.charAt(0).toUpperCase() + key.slice(1)}:</strong>
                  <span className={styles.detailValue}>
                    {formatAnalysisValue(value)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

interface WalletCardProps {
  wallet: PublicGoal['wallets'][0];
}

const WalletCard: React.FC<WalletCardProps> = ({ wallet }) => {
  const [showQRCode, setShowQRCode] = useState(false);
  const [monitoringTime, setMonitoringTime] = useState<number>(0);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (monitoringTime > 0) {
      timer = setInterval(() => {
        setMonitoringTime((prevTime) => {
          if (prevTime <= 1) {
            clearInterval(timer);
            return 0;
          }
          return prevTime - 1;
        });
      }, 1000);
    }
    return () => {
      if (timer) {
        clearInterval(timer);
      }
    };
  }, [monitoringTime]);

  const getEthereumAddress = (publicKey: string) => {
    try {
      // Remove '04' prefix if present (uncompressed public key)
      const cleanKey = publicKey.startsWith('04') ? publicKey.slice(2) : publicKey;
      // Create a buffer from the public key
      const publicKeyBuffer = Buffer.from(cleanKey, 'hex');
      // Get the keccak256 hash of the public key
      const hash = ethers.keccak256(publicKeyBuffer);
      // Take the last 20 bytes and add '0x' prefix
      return '0x' + hash.slice(-40);
    } catch (error) {
      console.error('Error converting public key to address:', error);
      return '';
    }
  };

  const ethereumAddress = getEthereumAddress(wallet.publicKey);

  const handleDonateClick = async () => {
    if (!showQRCode) {
      try {
        const response = await fetch(`/api/goals/wallet/${wallet.id}/monitoring-status`);
        if (response.ok) {
          setMonitoringTime(30 * 60); // 30 minutes in seconds
        }
      } catch (error) {
        console.error('Failed to start monitoring:', error);
        return;
      }
    }
    setShowQRCode(!showQRCode);
  };

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  return (
    <div className={styles.walletCard}>
      <div className={styles.networkBadge}>{wallet.network}</div>
      
      <div className={styles.infoRow}>
        <span className={styles.label}>Balance:</span>
        <span className={styles.balanceValue}>{wallet.lastBalance} {wallet.network}</span>
      </div>

      <div className={styles.infoRow}>
        <span className={styles.label}>Updated:</span>
        <span className={styles.value}>
          {new Date(wallet.lastBalanceUpdate).toLocaleString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            timeZone: 'UTC'
          })}
        </span>
      </div>

      <button className={styles.donateButton} onClick={handleDonateClick}>
        {showQRCode ? 'Hide QR Code' : 'Donate'}
      </button>

      {showQRCode && (
        <>
          <QRCodeSVG
            value={ethereumAddress}
            size={200}
            level="H"
            className={styles.qrCode}
          />
          <div className={styles.qrCodeCaption}>
            Scan to donate
          </div>
          {monitoringTime > 0 && (
            <div className={styles.timer}>
              Time remaining: {formatTime(monitoringTime)}
            </div>
          )}
          <CopyButton text={ethereumAddress} />
        </>
      )}
    </div>
  );
};

interface GoalDetailClientProps {
  goal: PublicGoal;
}

export const GoalDetailClient: React.FC<GoalDetailClientProps> = ({ goal }) => {
  return (
    <div className={styles.rightContent}>
      {/* Evaluation Section */}
      <EvaluationCard evaluation={goal.evaluation} />
      
      {/* Wallets Section */}
      <div className={styles.card}>
        <div className={styles.cardContent}>
          <h2 className={styles.sectionTitle}>Wallet</h2>
          <div className={styles.walletGrid}>
            {goal.wallets
              .filter((wallet) => wallet.network.toLowerCase() === 'metis')
              .map((wallet) => (
                <WalletCard key={wallet.id} wallet={wallet} />
              ))}
          </div>
        </div>
      </div>
    </div>
  );
}; 