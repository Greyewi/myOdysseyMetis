import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { GoalStatus, GoalWithWallet } from '../../types/goals';
import { useGoals } from '../../provider/goalProvider';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { QRCodeSVG } from 'qrcode.react';
import { config } from '@/config';
import axios from 'axios';
import { ethers } from 'ethers';
import { io, Socket } from 'socket.io-client';


const Container = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem 1rem;
  display: grid;
  grid-template-columns: 1fr;
  gap: 2rem;
  position: relative;

  @media (min-width: 1024px) {
    grid-template-columns: 2fr 1fr;
    grid-template-areas: "left right";
    padding: 2rem;
  }
`;

const LeftContent = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2rem;

  @media (min-width: 1024px) {
    grid-area: left;
  }
`;

const RightContent = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2rem;

  @media (min-width: 1024px) {
    grid-area: right;
    position: sticky;
    top: 2rem;
    height: fit-content;
    overflow-y: auto;
    overflow-x: hidden;
    padding-right: 1rem;
    align-self: start;
    margin-top: 0;
    
    /* Hide scrollbar but keep functionality */
    scrollbar-width: none; /* Firefox */
    -ms-overflow-style: none; /* IE and Edge */
    
    &::-webkit-scrollbar {
      display: none; /* Chrome, Safari and Opera */
    }
  }
`;

const Card = styled.div`
  background: white;
  border-radius: 16px;
  padding: 2.5rem;
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.08);
  border: 1px solid rgba(0, 0, 0, 0.05);
  transition: transform 0.2s ease, box-shadow 0.2s ease;
  display: flex;
  flex-direction: column;
  gap: 1rem;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 12px 24px rgba(0, 0, 0, 0.12);
  }
`;

const WalletCard = styled.div`
  background: white;
  border-radius: 12px;
  padding: 1.5rem;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.05);
  border: 1px solid rgba(0, 0, 0, 0.05);
  display: flex;
  flex-direction: column;
  gap: 1rem;
  transition: transform 0.2s ease;
  width: 100%;
  box-sizing: border-box;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 12px rgba(0, 0, 0, 0.08);
  }
`;

const Title = styled.h1`
  font-size: 2.5rem;
  margin:0;
  color: #1a1a1a;
  line-height: 1.2;
  font-weight: 700;
  position: relative;
  padding-bottom: 1rem;

  &::after {
    content: '';
    position: absolute;
    bottom: 0;
    left: 0;
    width: 60px;
    height: 4px;
    background: #1976d2;
    border-radius: 2px;
  }

  @media (max-width: 768px) {
    font-size: 2rem;
  }
`;

const Loading = styled.div`
  text-align: center;
  padding: 4rem;
  color: #666;
  font-size: 1.2rem;
`;

const StatusBadge = styled.span<{ status: GoalStatus }>`
  display: inline-block;
  padding: 0.5rem 1rem;
  border-radius: 20px;
  width: fit-content;
  font-size: 0.875rem;
  font-weight: 600;
  background-color: ${props => {
    switch (props.status) {
      case GoalStatus.PENDING:
        return '#e0e0e0';
      case GoalStatus.FUNDED:
        return '#ffb74d';
      case GoalStatus.ACTIVE:
        return '#64b5f6';
      case GoalStatus.COMPLETED:
        return '#81c784';
      case GoalStatus.FAILED:
        return '#e57373';
      default:
        return '#64b5f6';
    }
  }};
  color: ${props => {
    switch (props.status) {
      case GoalStatus.PENDING:
        return '#424242';
      default:
        return 'white';
    }
  }};
  margin-right: 0.75rem;
`;

const CategoryBadge = styled.span`
  display: inline-block;
  padding: 0.5rem 1rem;
  width: fit-content;
  background-color: #e3f2fd;
  color: #1976d2;
  border-radius: 20px;
  font-size: 0.875rem;
  font-weight: 600;
`;

const Description = styled.div`
  margin: 2rem 0;
  line-height: 1.8;
  color: #424242;
  font-size: 1.1rem;

  table {
    width: 100%;
    border-collapse: collapse;
    margin: 1.5rem 0;
    font-size: 1rem;
  }

  th, td {
    padding: 1rem;
    border: 1px solid #e0e0e0;
    text-align: left;
  }

  th {
    background-color: #f5f5f5;
    font-weight: 600;
  }

  tr:nth-child(even) {
    background-color: #f9f9f9;
  }

  tr:hover {
    background-color: #f5f5f5;
  }
`;

const InfoRow = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  width: 100%;
  box-sizing: border-box;
`;

const Label = styled.span`
  font-weight: 600;
  color: #666;
  font-size: 0.9rem;
`;

const Value = styled.div`
  color: #1a1a1a;
  font-size: 1rem;
  word-break: break-word;
  background-color: #f8f9fa;
  padding: 1rem;
  border-radius: 8px;
  border: 1px solid rgba(0, 0, 0, 0.05);
`;

const Section = styled.div`
  background: white;
  border-radius: 16px;
  padding: 2rem;
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.08);
  border: 1px solid rgba(0, 0, 0, 0.05);
`;

const SectionTitle = styled.h3`
  font-size: 1.5rem;
  margin-bottom: 1.5rem;
  color: #1a1a1a;
  font-weight: 600;
  padding-bottom: 0.75rem;
  border-bottom: 2px solid #e0e0e0;
`;

const WalletGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 1.5rem;

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
`;

const NetworkBadge = styled.span`
  display: inline-block;
  padding: 0.5rem 1rem;
  width: fit-content;
  background-color: #e3f2fd;
  color: #1976d2;
  border-radius: 20px;
  font-size: 0.875rem;
  font-weight: 600;
`;

const BalanceValue = styled.span`
  font-weight: 700;
  color: #2e7d32;
  font-size: 1.2rem;
`;

const UserSection = styled.div`
  margin-bottom: 2rem;
  padding: 2rem;
  background-color: white;
  border-radius: 16px;
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.08);
  border: 1px solid rgba(0, 0, 0, 0.05);
`;

const UserTitle = styled.h3`
  font-size: 1.5rem;
  margin-bottom: 1.5rem;
  color: #1a1a1a;
  font-weight: 600;
  position: relative;
  padding-bottom: 1rem;

  &::after {
    content: '';
    position: absolute;
    bottom: 0;
    left: 0;
    width: 60px;
    height: 4px;
    background: #1976d2;
    border-radius: 2px;
  }
`;

const UserAddress = styled.span`
  font-family: 'Roboto Mono', monospace;
  font-size: 0.9rem;
  color: #666;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  word-break: break-all;
  
  &:hover {
    color: #1976d2;
  }
`;

const GoBackButton = styled.button`
  background: #1976d2;
  color: white;
  border: none;
  padding: 1rem 2rem;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: background-color 0.2s ease;
  
  &:hover {
    background-color: #1565c0;
  }
`;

const CopyButton = styled.button`
  background: none;
  border: none;
  color: #1976d2;
  cursor: pointer;
  font-size: 0.9rem;
  padding: 0.5rem;
  border-radius: 4px;
  transition: background-color 0.2s;
  
  &:hover {
    background-color: rgba(25, 118, 210, 0.1);
  }
`;

const CopyNotification = styled.div`
  position: fixed;
  bottom: 20px;
  right: 20px;
  background-color: #2e7d32;
  color: white;
  padding: 1rem 2rem;
  border-radius: 8px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  z-index: 1000;
  animation: slideIn 0.3s ease;

  @keyframes slideIn {
    from {
      transform: translateY(100%);
      opacity: 0;
    }
    to {
      transform: translateY(0);
      opacity: 1;
    }
  }
`;

const QRCodeContainer = styled.div<{ isVisible?: boolean }>`
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
  display: flex;
  flex-direction: column;
  align-items: center;
  overflow: hidden;
  max-height: ${props => props.isVisible ? '500px' : '0'};
  opacity: ${props => props.isVisible ? '1' : '0'};
  transition: all 0.3s ease;
  padding: ${props => props.isVisible ? '1.5rem' : '0'};
  margin: ${props => props.isVisible ? '1rem 0 0 0' : '0'};
  visibility: ${props => props.isVisible ? 'visible' : 'hidden'};
`;

const QRCodeCaption = styled.div`
  font-size: 0.9rem;
  color: #666;
  margin-top: 1rem;
  text-align: center;
`;

const ShowQRButton = styled.button`
  background: #1976d2;
  color: white;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 8px;
  font-size: 0.9rem;
  font-weight: 600;
  cursor: pointer;
  transition: background-color 0.2s ease;
  width: 100%;
  
  &:hover {
    background-color: #1565c0;
  }
`;

const SpoilerText = styled.div`
  background: #f5f5f5;
  padding: 0.5rem;
  border-radius: 4px;
  font-family: 'Roboto Mono', monospace;
  font-size: 0.9rem;
  color: #666;
  margin-top: 0.5rem;
  word-break: break-all;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
`;

const SpoilerAddress = styled.span`
  flex: 1;
`;

const SpoilerCopyButton = styled(CopyButton)`
  flex-shrink: 0;
  padding: 0.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
  
  svg {
    width: 16px;
    height: 16px;
  }
  
  &:hover {
    background-color: rgba(25, 118, 210, 0.1);
  }
`;

const UserInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 1.5rem;
  margin-bottom: 1.5rem;
`;

const Statuses = styled.div`
  display: flex;
  gap: 0.5rem;
`;

const Avatar = styled.div<{ src?: string }>`
  width: 64px;
  height: 64px;
  border-radius: 50%;
  background-color: #e0e0e0;
  background-image: ${props => props.src ? `url(${props.src})` : 'none'};
  background-size: cover;
  background-position: center;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
  color: #757575;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
`;

const UserName = styled.div`
  font-weight: 600;
  font-size: 1.2rem;
  color: #1a1a1a;
`;

const UserBio = styled.div`
  margin-top: 1rem;
  color: #424242;
  font-size: 1rem;
  line-height: 1.6;
  
  p {
    margin-top: 0;
    margin-bottom: 1rem;
  }
  
  a {
    color: #1976d2;
    text-decoration: none;
    
    &:hover {
      text-decoration: underline;
    }
  }
  
  ul, ol {
    padding-left: 1.5rem;
    margin-bottom: 1rem;
  }
`;

const ThumbnailWrapper = styled.div<{ imageUrl: string }>`
  width: calc(100% + 5rem);
  height: 400px;
  background: #f0f0f0;
  background-image: url(${props => props.imageUrl});
  background-size: cover;
  background-position: center;
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.08);
  border: 1px solid rgba(0, 0, 0, 0.05);
  margin: -2.5rem -2.5rem 2rem 0;
  position: relative;
  left: -2.5rem;

  @media (max-width: 768px) {
    height: 300px;
    width: calc(100% + 5rem);
    margin: -2.5rem -3.5rem 1rem -1rem;
    left: -1.5rem;
  }
`;

const DescriptionBlock = styled(Card)`
  margin-bottom: 2rem;
`;

const getStatusLabel = (status: GoalStatus): string => {
  switch (status) {
    case GoalStatus.PENDING:
      return 'Awaiting Funds';
    case GoalStatus.FUNDED:
      return 'Unpublished';
    case GoalStatus.ACTIVE:
      return 'Published';
    case GoalStatus.COMPLETED:
      return 'Completed';
    case GoalStatus.FAILED:
      return 'Failed';
    default:
      return status;
  }
};

const Timer = styled.div`
  font-size: 1.2rem;
  color: #1976d2;
  margin: 1rem 0;
  font-weight: 600;
`;

const Message = styled.p`
  color: #424242;
  margin: 1rem 0;
  line-height: 1.6;
  text-align: center;
`;

const ErrorMessage = styled.div`
  color: #d32f2f;
  font-size: 0.875rem;
  margin-top: 0.5rem;
  text-align: center;
`;

const publicKeyToAddress = (publicKey: string): string => {
  try {
    if (publicKey.startsWith('04')) {
      const cleanPublicKey = publicKey.slice(2);
      const addressBuffer = ethers.keccak256('0x' + cleanPublicKey);
      const ethereumAddress = '0x' + addressBuffer.slice(-40);
      return ethers.getAddress(ethereumAddress);
    }
    return publicKey;
  } catch (e) {
    console.error('Error converting public key to address:', e);
    return publicKey;
  }
};

interface Wallet {
  id: number;
  publicKey: string;
  network: string;
  lastBalance: string;
  lastBalanceUpdate: Date | null;
}

const PublicGoalDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { getPublishedGoal, getTotalBalanceInUSD, isLoading: pricesLoading } = useGoals();
  const [goal, setGoal] = useState<GoalWithWallet | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalBalanceUSD, setTotalBalanceUSD] = useState<number>(0);
  const [showCopyNotification, setShowCopyNotification] = useState(false);
  const [visibleQRCodes, setVisibleQRCodes] = useState<Record<number, boolean>>({});
  const [selectedWallet, setSelectedWallet] = useState<Wallet | null>(null);
  const [showQRCode, setShowQRCode] = useState(false);
  const [timeLeft, setTimeLeft] = useState<number>(30 * 60); // 30 minutes in seconds
  const [isMonitoring, setIsMonitoring] = useState(false);
  const [monitoringWallets, setMonitoringWallets] = useState<Record<number, number>>({}); // walletId -> timeLeft
  const [rateLimitError, setRateLimitError] = useState<string | null>(null);
  const [socket, setSocket] = useState<Socket | null>(null);
  
  // Update total balance when prices are loaded or goal changes
  useEffect(() => {
    if (goal?.wallets && !pricesLoading) {
      const total = getTotalBalanceInUSD(goal.wallets);
      setTotalBalanceUSD(total);
    }
  }, [goal?.wallets, pricesLoading, getTotalBalanceInUSD]);
  
  useEffect(() => {
    const fetchGoal = async () => {
      if (!id) return;
      
      try {
        setLoading(true);
        const fetchedGoal = await getPublishedGoal(Number(id));
        setGoal(fetchedGoal);
        setError(null);
      } catch (err) {
        setError('Goal not found or not published');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchGoal();
  }, [id]);
  
  useEffect(() => {
    // Initialize socket connection
    const socketInstance = io(config.apiUrl, {
      withCredentials: true
    });

    socketInstance.on('connect', () => {
      console.log('Connected to socket server');
    });

    socketInstance.on('balance-change', (data) => {
      console.log('Balance changed:', data);
      // Update the wallet balance in the UI
      if (data.walletId === selectedWallet?.id) {
        setSelectedWallet(prev => prev ? {
          ...prev,
          lastBalance: data.balance,
          lastBalanceUpdate: new Date(data.timestamp)
        } : null);
      }
      
      // Update the wallet in goal.wallets array
      setGoal(prev => {
        if (!prev) return null;
        return {
          ...prev,
          wallets: prev.wallets.map(wallet => 
            wallet.id === data.walletId 
              ? {
                  ...wallet,
                  lastBalance: data.balance,
                  lastBalanceUpdate: new Date(data.timestamp)
                }
              : wallet
          )
        };
      });

      // Update total balance
      if (goal) {
        const updatedWallets = goal.wallets.map(wallet => 
          wallet.id === data.walletId 
            ? {
                ...wallet,
                lastBalance: data.balance,
                lastBalanceUpdate: new Date(data.timestamp)
              }
            : wallet
        );
        const newTotal = getTotalBalanceInUSD(updatedWallets);
        setTotalBalanceUSD(newTotal);
      }
    });

    setSocket(socketInstance);

    // Cleanup on unmount
    return () => {
      socketInstance.disconnect();
    };
  }, [selectedWallet?.id]);

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };
  
  const formatWalletAddress = (publicKey: string) => {
    const address = publicKeyToAddress(publicKey);
    if (!address || address.length <= 10) return address;
    return `${address.slice(0, 8)}...${address.slice(-6)}`;
  };
  
  const copyToClipboard = async (address: string) => {
    try {
      await navigator.clipboard.writeText(address);
      setShowCopyNotification(true);
      
      // Hide the notification after 2 seconds
      setTimeout(() => {
        setShowCopyNotification(false);
      }, 2000);
    } catch (error) {
      console.error('Failed to copy to clipboard:', error);
    }
  };
  
  const navigateToUserProfile = (userId: number) => {
    navigate(`/user/${userId}`);
  };
  
  const toggleQRCode = async (walletId: number) => {
    const isCurrentlyVisible = visibleQRCodes[walletId];
    
    if (!isCurrentlyVisible) {
      try {
        // Start monitoring when showing QR code
        const response = await axios.get(`${config.apiUrl}/goals/wallet/${walletId}/monitoring-status`);
        setMonitoringWallets(prev => ({
          ...prev,
          [walletId]: 30 * 60 // 30 minutes in seconds
        }));
        setRateLimitError(null);
      } catch (error: any) {
        if (error.response?.status === 429) {
          setRateLimitError(error.response.data.message);
          return;
        }
        console.error('Failed to start monitoring:', error);
        return;
      }
    }

    setVisibleQRCodes(prev => ({
      ...prev,
      [walletId]: !prev[walletId]
    }));
  };

  // Add effect for monitoring timers
  useEffect(() => {
    const timers: Record<number, NodeJS.Timeout> = {};

    Object.entries(monitoringWallets).forEach(([walletIdStr, timeLeft]) => {
      const walletId = Number(walletIdStr);
      if (timeLeft > 0) {
        timers[walletId] = setInterval(() => {
          setMonitoringWallets(prev => {
            const newTimeLeft = prev[walletId] - 1;
            if (newTimeLeft <= 0) {
              clearInterval(timers[walletId]);
              setVisibleQRCodes(prev => ({
                ...prev,
                [walletId]: false
              }));
              return { ...prev, [walletId]: 0 };
            }
            return { ...prev, [walletId]: newTimeLeft };
          });
        }, 1000);
      }
    });

    return () => {
      Object.values(timers).forEach(timer => clearInterval(timer));
    };
  }, [monitoringWallets]);

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };
  
  const handleStartMonitoring = async () => {
    if (!selectedWallet || !goal) return;

    try {
      setIsMonitoring(true);
      const response = await axios.post(
        `${config.apiUrl}/goals/${goal.id}/monitoring-status`,
        {
          walletId: selectedWallet.id,
          isActive: true
        },
        { withCredentials: true }
      );

      console.log('Monitoring started:', response.data);
    } catch (error) {
      console.error('Error starting monitoring:', error);
      setIsMonitoring(false);
    }
  };

  const handleStopMonitoring = async () => {
    if (!selectedWallet || !goal) return;

    try {
      setIsMonitoring(false);
      const response = await axios.post(
        `${config.apiUrl}/goals/${goal.id}/monitoring-status`,
        {
          walletId: selectedWallet.id,
          isActive: false
        },
        { withCredentials: true }
      );

      console.log('Monitoring stopped:', response.data);
    } catch (error) {
      console.error('Error stopping monitoring:', error);
    }
  };
  
  if (loading || pricesLoading) {
    return <Loading>Loading goal details...</Loading>;
  }
  
  if (error || !goal) {
    return (
      <Container>
        <Card>
          <Title>Error</Title>
          <p>{error || 'Goal not found'}</p>
          <GoBackButton onClick={() => navigate('/')}>Back to Home</GoBackButton>
        </Card>
      </Container>
    );
  }
  
  return (
    <Container>
      <LeftContent>
        <Card>
          {goal.image && (
            <ThumbnailWrapper imageUrl={`${config.backendUrl}/${goal.image}`} />
          )}
          <Title>{goal.title}</Title>
          
          <Statuses>
            <StatusBadge status={goal.status}>{getStatusLabel(goal.status)}</StatusBadge>
            <CategoryBadge>{goal.category}</CategoryBadge>
          </Statuses>
          
          <InfoRow>
            <Label>Deadline:</Label>
            <Value>{formatDate(goal.deadline)}</Value>
          </InfoRow>
          
          <InfoRow>
            <Label>Total Balance:</Label>
            <Value><BalanceValue>${totalBalanceUSD.toFixed(2)} USD</BalanceValue></Value>
          </InfoRow>
        </Card>

        <DescriptionBlock>
          <SectionTitle>Description</SectionTitle>
          <Description>
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {goal.description}
            </ReactMarkdown>
          </Description>
        </DescriptionBlock>

        {goal.user && (
          <UserSection>
            <UserTitle>Created by</UserTitle>
            {goal.user.profile && (
              <>
                <UserInfo>
                  <Avatar 
                    src={goal.user.profile.avatar || undefined}
                  >
                    {!goal.user.profile.avatar && (goal.user.profile.username?.[0]?.toUpperCase() || '?')}
                  </Avatar>
                  <div>
                    <UserName>
                      {goal.user.profile.username || formatWalletAddress(goal.user.address || '')}
                    </UserName>
                  </div>
                </UserInfo>
                {goal.user.profile.bio && (
                  <UserBio>
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                      {goal.user.profile.bio}
                    </ReactMarkdown>
                  </UserBio>
                )}
              </>
            )}  
            <InfoRow>
              <Label>User Address:</Label>
              <Value>
                <UserAddress>
                  {goal.user.address}
                  <CopyButton 
                    onClick={() => copyToClipboard(goal.user!.address)}
                    title="Copy full address"
                  >
                    Copy
                  </CopyButton>
                </UserAddress>
              </Value>
            </InfoRow>
          </UserSection>
        )}
      </LeftContent>

      <RightContent>
        {goal.wallets && goal.wallets.length > 0 ? (
          <WalletGrid>
            {goal.wallets.map(wallet => (
              <WalletCard key={wallet.id}>
                <InfoRow>
                  <Label>Network: <NetworkBadge>{wallet.network}</NetworkBadge></Label>
                </InfoRow>
                <InfoRow>
                  <Label>Balance:</Label>
                  <Value>
                    {wallet.lastBalance || '0'} {wallet.network}
                  </Value>
                </InfoRow>
                {wallet.lastBalanceUpdate && (
                  <InfoRow>
                    <Label>Updated:</Label>
                    <Value>{formatDate(wallet.lastBalanceUpdate)}</Value>
                  </InfoRow>
                )}
                <ShowQRButton onClick={() => toggleQRCode(wallet.id)}>
                  {visibleQRCodes[wallet.id] ? 'Finish' : 'Donate'}
                </ShowQRButton>
                {rateLimitError && !visibleQRCodes[wallet.id] && (
                  <ErrorMessage>{rateLimitError}</ErrorMessage>
                )}
                <QRCodeContainer isVisible={visibleQRCodes[wallet.id]}>
                  <QRCodeSVG
                    value={publicKeyToAddress(wallet.publicKey)}
                    size={120}
                    level="H"
                  />
                  <SpoilerText>
                    <SpoilerAddress>{publicKeyToAddress(wallet.publicKey)}</SpoilerAddress>
                    <SpoilerCopyButton 
                      onClick={() => copyToClipboard(publicKeyToAddress(wallet.publicKey))}
                      title="Copy full address"
                    >
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                        <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                      </svg>
                    </SpoilerCopyButton>
                  </SpoilerText>
                  {monitoringWallets[wallet.id] > 0 && (
                    <>
                      <Timer>Time remaining: {formatTime(monitoringWallets[wallet.id])}</Timer>
                      <Message>
                        After sending your donation, the system will automatically detect it
                        and update the goal's status.
                      </Message>
                    </>
                  )}
                  <QRCodeCaption>Scan to donate</QRCodeCaption>
                </QRCodeContainer>
              </WalletCard>
            ))}
          </WalletGrid>
        ) : (
          <p>No wallets found for this goal.</p>
        )}
      </RightContent>
      
      {showCopyNotification && (
        <CopyNotification>
          Address copied to clipboard!
        </CopyNotification>
      )}
    </Container>
  );
};

export default PublicGoalDetail; 