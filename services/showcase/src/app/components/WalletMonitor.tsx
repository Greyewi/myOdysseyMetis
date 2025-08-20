import React, { useState, useEffect } from 'react';
import { io, Socket } from 'socket.io-client';
import { QRCodeSVG } from 'qrcode.react';
import styles from './WalletMonitor.module.css';
import type { Wallet } from '../types/goals';

interface WalletMonitorProps {
  wallet: Wallet;
  onBalanceUpdate: (walletId: number, newBalance: number) => void;
}

export const WalletMonitor: React.FC<WalletMonitorProps> = ({ wallet, onBalanceUpdate }) => {
  const [showQRCode, setShowQRCode] = useState(false);
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [socket, setSocket] = useState<Socket | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (showQRCode) {
      // Initialize socket connection
      const socketInstance = io(process.env.NEXT_PUBLIC_API_URL || 'https://myodyssey.me', {
        withCredentials: true
      });

      socketInstance.on('connect', () => {
        console.log('Connected to socket server');
      });

      socketInstance.on('balance-change', (data) => {
        if (data.walletId === wallet.id) {
          onBalanceUpdate(wallet.id, parseFloat(data.balance));
        }
      });

      socketInstance.on('error', (error) => {
        console.error('Socket error:', error);
        setError('Connection error. Please try again.');
      });

      setSocket(socketInstance);

      // Start 30-minute timer
      setTimeLeft(30 * 60);

      // Cleanup on unmount or when QR code is hidden
      return () => {
        socketInstance.disconnect();
      };
    }
  }, [showQRCode, wallet.id]);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (timeLeft > 0) {
      timer = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            setShowQRCode(false);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [timeLeft]);

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const handleDonateClick = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/public-goals/wallet/${wallet.id}/monitoring-status`);
      if (response.status === 429) {
        const data = await response.json();
        setError(data.message);
        return;
      }
      setShowQRCode(true);
      setError(null);
    } catch (err) {
      console.error('Failed to start monitoring:', err);
      setError('Failed to start monitoring. Please try again.');
    }
  };

  return (
    <div className={styles.walletMonitor}>
      {showQRCode ? (
        <div className={styles.qrContainer}>
          <QRCodeSVG
            value={wallet.address}
            size={200}
            level="H"
            includeMargin
            className={styles.qrCode}
          />
          <div className={styles.timer}>
            Time remaining: {formatTime(timeLeft)}
          </div>
          <button
            className={styles.closeButton}
            onClick={() => setShowQRCode(false)}
          >
            Close QR Code
          </button>
        </div>
      ) : (
        <button
          className={styles.donateButton}
          onClick={handleDonateClick}
        >
          Donate
        </button>
      )}
      {error && <div className={styles.error}>{error}</div>}
    </div>
  );
}; 