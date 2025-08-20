import React, { useState, useRef, useEffect } from 'react';
import styled from 'styled-components';
import { Link } from 'react-router-dom';
import ActionButtonList from './WalletConnect';
import { useAppKitAccount, useWalletInfo } from '../config';
import { getProfile } from '../api/profile';

interface Profile {
  id: number;
  username: string;
  email: string;
  bio: string;
  avatar: string;
  wallets: Array<{
    id: number;
    address: string;
    walletType: string;
    createdAt: string;
  }>;
}

const HeaderContainer = styled.header`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.5rem 2rem;
  background-color: #ffffff;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  position: sticky;
  top: 0;
  z-index: 1000;
  
  @media (max-width: 480px) {
    padding: 0.5rem 1rem;
  }
`;

const LogoContainer = styled(Link)`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  text-decoration: none;
  color: #333;
  
  &:hover {
    color: #666;
  }
  
  @media (max-width: 480px) {
    gap: 0.25rem;
  }
`;

const LogoImage = styled.img`
  height: 33px;
  width: auto;
  
  @media (max-width: 480px) {
    height: 33px;
  }
`;

const RightContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
`;

const UserAvatarContainer = styled.div`
  position: relative;
  display: inline-block;
`;

const UserAvatar = styled.div<{ isOpen: boolean; hasCustomAvatar: boolean }>`
  width: 40px;
  height: 40px;
  border-radius: 50%;
  ${props => props.hasCustomAvatar ? `
    background-image: url(${props.hasCustomAvatar});
    background-size: cover;
    background-position: center;
    border: 2px solid #0ea5e9;
  ` : `
    background: linear-gradient(135deg, #0369a1 0%, #0ea5e9 50%, rgb(14, 165, 233) 100%);
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
    font-weight: bold;
    font-size: 0.9rem;
  `}
  cursor: pointer;
  transition: all 0.2s ease;
  border: 2px solid transparent;
  
  &:hover {
    transform: scale(1.05);
    border-color: #0ea5e9;
    box-shadow: 0 4px 12px rgba(14, 165, 233, 0.3);
  }
  
  ${props => props.isOpen && `
    transform: scale(1.05);
    border-color: #0ea5e9;
    box-shadow: 0 4px 12px rgba(14, 165, 233, 0.3);
  `}
  
  @media (max-width: 768px) {
    width: 36px;
    height: 36px;
    font-size: 0.8rem;
  }
  
  /* Touch feedback for mobile */
  @media (hover: none) and (pointer: coarse) {
    &:active {
      transform: scale(0.95);
    }
  }
`;

const AvatarImage = styled.img`
  width: 100%;
  height: 100%;
  border-radius: 50%;
  object-fit: cover;
`;

const DropdownMenu = styled.div<{ isOpen: boolean }>`
  position: absolute;
  top: 100%;
  right: 0;
  margin-top: 8px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12);
  border: 1px solid rgba(0, 0, 0, 0.08);
  min-width: 220px;
  opacity: ${props => props.isOpen ? 1 : 0};
  visibility: ${props => props.isOpen ? 'visible' : 'hidden'};
  transform: ${props => props.isOpen ? 'translateY(0)' : 'translateY(-10px)'};
  transition: all 0.2s ease;
  z-index: 1001;
  padding: 2px;
  
  /* Arrow pointing up */
  &::before {
    content: '';
    position: absolute;
    top: -6px;
    right: 16px;
    width: 12px;
    height: 12px;
    background: white;
    border: 1px solid rgba(0, 0, 0, 0.08);
    border-bottom: none;
    border-right: none;
    transform: rotate(45deg);
  }
  
  @media (max-width: 768px) {
    right: -8px;
    min-width: 200px;
    
    &::before {
      right: 20px;
    }
  }
`;

const WalletInfo = styled.div`
  padding: 16px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.08);
  margin-bottom: 4px;
`;

const WalletName = styled.div`
  font-weight: 600;
  font-size: 0.9rem;
  color: #333;
  margin-bottom: 4px;
  display: flex;
  align-items: center;
  gap: 6px;
`;

const WalletAddress = styled.div`
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  font-size: 0.8rem;
  color: #666;
  background: #f8fafc;
  padding: 4px 8px;
  border-radius: 6px;
  cursor: pointer;
  transition: background-color 0.15s ease;
  
  &:hover {
    background: #e2e8f0;
  }
`;

const CopyIcon = styled.span`
  font-size: 0.7rem;
  margin-left: 4px;
  opacity: 0.6;
`;

const DropdownLink = styled(Link)`
  display: block;
  padding: 12px 16px;
  color: #333;
  text-decoration: none;
  font-weight: 500;
  font-size: 0.9rem;
  border-radius: 8px;
  margin: 4px 8px;
  transition: all 0.15s ease;
  
  &:hover {
    background-color: #f8fafc;
    color: #0ea5e9;
    transform: translateX(2px);
  }
  
  &:first-child {
    margin-top: 8px;
  }
  
  &:last-child {
    margin-bottom: 8px;
  }
  
  /* Touch feedback for mobile */
  @media (hover: none) and (pointer: coarse) {
    &:active {
      background-color: #e2e8f0;
      transform: translateX(1px);
    }
  }
`;

const DropdownActionButton = styled.div`
  padding: 8px 16px;
  margin: 4px 8px;
  
  button {
    width: 100%;
    padding: 10px 16px;
    background: #f1f5f9;
    color: #64748b;
    border: 1px solid #e2e8f0;
    border-radius: 8px;
    font-weight: 500;
    font-size: 0.9rem;
    transition: all 0.15s ease;
    cursor: pointer;
    
    &:hover {
      background: #e2e8f0;
      color: #475569;
      transform: translateX(2px);
    }
    
    /* Touch feedback for mobile */
    @media (hover: none) and (pointer: coarse) {
      &:active {
        background: #cbd5e1;
        transform: translateX(1px);
      }
    }
  }
`;

const ConnectButtonContainer = styled.div`
  display: flex;
  align-items: center;
  
  @media (max-width: 480px) {
    scale: 0.9;
    transform-origin: right center;
  }
`;

const Header: React.FC = () => {
  const { isConnected, address } = useAppKitAccount();
  const { walletInfo } = useWalletInfo();
  const isAuthorized = isConnected && address;
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [profile, setProfile] = useState<Profile | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const timeoutRef = useRef<NodeJS.Timeout>();

  // Fetch user profile when connected
  useEffect(() => {
    if (isAuthorized) {
      const fetchProfile = async () => {
        try {
          const profileData = await getProfile();
          setProfile(profileData);
        } catch (error) {
          console.error('Failed to fetch profile:', error);
          // Don't show error to user, just use fallback
        }
      };
      fetchProfile();
    } else {
      setProfile(null);
    }
  }, [isAuthorized]);

  // Get user initials from address or username
  const getUserInitials = () => {
    if (profile?.username) {
      const words = profile.username.split(' ').filter(word => word.length > 0);
      if (words.length > 1) {
        return (words[0][0] + words[1][0]).toUpperCase();
      }
      return words[0]?.slice(0, 2).toUpperCase() || 'U';
    }
    if (!address) return 'U';
    return address.slice(2, 4).toUpperCase();
  };

  // Get wallet display name
  const getWalletName = () => {
    if (walletInfo?.name) {
      return walletInfo.name;
    }
    // Fallback to detect from user agent or other methods
    if (typeof window !== 'undefined' && (window as any).ethereum) {
      if ((window as any).ethereum.isMetaMask) return 'MetaMask';
      if ((window as any).ethereum.isTrust) return 'Trust Wallet';
      if ((window as any).ethereum.isCoinbaseWallet) return 'Coinbase Wallet';
    }
    return 'Connected Wallet';
  };

  // Copy address to clipboard
  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      // Could add a toast notification here
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  // Handle mouse events for desktop
  const handleMouseEnter = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    setIsDropdownOpen(true);
  };

  const handleMouseLeave = () => {
    timeoutRef.current = setTimeout(() => {
      setIsDropdownOpen(false);
    }, 300);
  };

  // Handle click events for mobile
  const handleAvatarClick = () => {
    setIsDropdownOpen(!isDropdownOpen);
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };

    if (isDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isDropdownOpen]);

  // Clean up timeout on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return (
    <HeaderContainer>
      <LogoContainer to="https://myodyssey.me">
        <LogoImage src="/assets/logo-2.svg" alt="My Odyssey Logo" />
      </LogoContainer>
      
      <RightContainer>
        {isAuthorized && (
          <UserAvatarContainer 
            ref={dropdownRef}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
          >
            <UserAvatar 
              isOpen={isDropdownOpen}
              hasCustomAvatar={!!profile?.avatar}
              onClick={handleAvatarClick}
            >
              {profile?.avatar ? (
                <AvatarImage src={profile.avatar} alt="User Avatar" />
              ) : (
                getUserInitials()
              )}
            </UserAvatar>
            <DropdownMenu isOpen={isDropdownOpen}>
              <WalletInfo>
                <WalletName>
                  🔗 {getWalletName()}
                </WalletName>
                <WalletAddress onClick={() => copyToClipboard(address || '')}>
                  {address ? `${address.slice(0, 6)}...${address.slice(-4)}` : ''}
                  <CopyIcon>📋</CopyIcon>
                </WalletAddress>
              </WalletInfo>
              <DropdownLink to="/" onClick={() => setIsDropdownOpen(false)}>
                ✨ New Goal
              </DropdownLink>
              <DropdownLink to="/my-goals" onClick={() => setIsDropdownOpen(false)}>
                🎯 My Goals
              </DropdownLink>
              <DropdownLink to="/profile" onClick={() => setIsDropdownOpen(false)}>
                👤 Profile
              </DropdownLink>
              <DropdownLink to="/how-it-works" onClick={() => setIsDropdownOpen(false)}>
                ❓ How it works
              </DropdownLink>
              <DropdownActionButton>
                <ActionButtonList />
              </DropdownActionButton>
            </DropdownMenu>
          </UserAvatarContainer>
        )}
        {!isConnected && <ConnectButtonContainer>
          <ActionButtonList />
        </ConnectButtonContainer>}
      </RightContainer> 
    </HeaderContainer>
  );
};

export default Header; 