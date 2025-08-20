import React, { useEffect, useCallback, useRef } from 'react';
import styled from 'styled-components';
import { useAppKit, useAppKitAccount, useDisconnect } from '../config';
import { isMobile, isIOS, isAndroid } from '../../utils/deviceDetection';
import { useNavigate } from 'react-router-dom';
import { useSignMessage } from 'wagmi';
import { getNonce, verifySignature } from '../api/auth';

const TOKEN_KEY = 'cryptogoals_auth_token';

const Button = styled.button`
  padding: 10px 20px;
  border-radius: 8px;
  border: none;
  background-color: #2196F3;
  color: white;
  cursor: pointer;
  font-weight: 500;
  transition: background-color 0.2s;
  width: 100%;
  margin: 10px 0;

  &:hover {
    background-color: #0056b3;
  }

  &:disabled {
    background-color: #cccccc;
    cursor: not-allowed;
  }
`;

const Container = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  margin: 10px 0;
`;

const StatusMessage = styled.div`
  margin: 10px 0;
  font-size: 14px;
  color: #666;
`;

const MobileWalletConnect: React.FC = () => {
  const { open, close } = useAppKit();
  const { isConnected, address } = useAppKitAccount();
  const { disconnect } = useDisconnect();
  const navigate = useNavigate();
  const { signMessageAsync } = useSignMessage();
  const isAuthenticating = useRef(false);
  
  const token = localStorage.getItem(TOKEN_KEY);

  const handleSignTransaction = useCallback(async (address: string | undefined) => {
    if (!address || isAuthenticating.current) return;

    try {
      isAuthenticating.current = true;
      const nonce = await getNonce(address);
      const message = `Sign this message to authenticate with My Odyssey. Nonce: ${nonce}`;
      const signature = await signMessageAsync({ message });
      const { token } = await verifySignature(address, signature, nonce);
      localStorage.setItem(TOKEN_KEY, token);
      console.log('Authentication successful');
    } catch (error) {
      console.error('Error during authentication:', error);
    } finally {
      isAuthenticating.current = false;
    }
  }, [signMessageAsync]);

  // Only sign once when connected and without token
  useEffect(() => {
    let isMounted = true;
    
    if (isConnected && address && !token && isMounted && !isAuthenticating.current) {
      handleSignTransaction(address);
    }
    
    // Cleanup function to prevent memory leaks and multiple listeners
    return () => {
      isMounted = false;
    };
  }, [isConnected, address, token, handleSignTransaction]);
  
  // Ensure the correct relay URL is used for WalletConnect
  useEffect(() => {
    if (typeof window !== 'undefined') {
      // Fix the incorrect relay URL if present
      if (localStorage.getItem('wc@2:client:0:relayUrl') === 'wss://relay.walletconnect.org') {
        localStorage.setItem('wc@2:client:0:relayUrl', 'wss://relay.walletconnect.com');
      }
    }
  }, []);
  
  const handleConnect = () => {
    // Fix the relay URL before connecting
    if (typeof window !== 'undefined') {
      localStorage.setItem('wc@2:client:0:relayUrl', 'wss://relay.walletconnect.com');
    }
    
    // Clean any existing WalletConnect sessions before connecting
    if (typeof window !== 'undefined') {
      // Clear localStorage items related to WalletConnect
      Object.keys(localStorage)
        .filter(key => key.startsWith('wc@') || key.includes('walletconnect'))
        .forEach(key => {
          // Don't remove relay URL, but fix it if needed
          if (key === 'wc@2:client:0:relayUrl') {
            localStorage.setItem(key, 'wss://relay.walletconnect.com');
          } else {
            localStorage.removeItem(key);
          }
        });
    }
    
    // Force close any existing modal before opening
    close();
    
    // Small delay to ensure previous modal is fully closed
    setTimeout(() => {
      // Ensure the correct relay URL is set before opening modal
      localStorage.setItem('wc@2:client:0:relayUrl', 'wss://relay.walletconnect.com');
      open();
    }, 100);
  };

  const handleDisconnect = async () => {
    try {
      await disconnect();
      localStorage.removeItem(TOKEN_KEY);
      
      // Clear any remaining WalletConnect sessions
      if (typeof window !== 'undefined') {
        Object.keys(localStorage)
          .filter(key => key.startsWith('wc@') || key.includes('walletconnect'))
          .forEach(key => localStorage.removeItem(key));
      }
      
      navigate('/');
    } catch (error) {
      console.error('Error during disconnect:', error);
    }
  };

  return (
    <Container>
      {!isConnected && !token ? (
        <>
          <Button onClick={handleConnect}>Connect Wallet</Button>
          {isMobile() && (
            <StatusMessage>
              You'll be prompted to open your wallet app
            </StatusMessage>
          )}
        </>
      ) : (
        <>
          <StatusMessage>
            Connected: {address?.slice(0, 6)}...{address?.slice(-4)}
          </StatusMessage>
          <Button onClick={handleDisconnect}>Disconnect</Button>
        </>
      )}
    </Container>
  );
};

export default MobileWalletConnect; 