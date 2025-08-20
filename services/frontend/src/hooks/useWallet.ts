import { useState, useEffect, useCallback } from 'react';
import { ethers } from 'ethers';
import { isMobileDevice } from '../utils/contract';

export interface WalletState {
  isConnected: boolean;
  address: string | null;
  provider: ethers.BrowserProvider | null;
  signer: ethers.JsonRpcSigner | null;
  isConnecting: boolean;
  error: string | null;
}

export const useWallet = () => {
  const [state, setState] = useState<WalletState>({
    isConnected: false,
    address: null,
    provider: null,
    signer: null,
    isConnecting: false,
    error: null,
  });
  console.log('state', state.isConnected);
  const connect = useCallback(async () => {
    setState(prev => ({ ...prev, isConnecting: true, error: null }));

    try {
      if (typeof window === 'undefined') {
        throw new Error('Window is not defined');
      }

      // Check if MetaMask is available
      if (!window.ethereum) {
        if (isMobileDevice()) {
          throw new Error('No wallet detected. Please install MetaMask or use WalletConnect.');
        } else {
          throw new Error('No wallet detected. Please install MetaMask.');
        }
      }

      // Request account access
      await (window.ethereum as any).request({ method: 'eth_requestAccounts' });

      // Create provider and signer
      const provider = new ethers.BrowserProvider(window.ethereum as any);
      const signer = await provider.getSigner();
      const address = await signer.getAddress();

      setState({
        isConnected: true,
        address,
        provider,
        signer,
        isConnecting: false,
        error: null,
      });

      console.log('Wallet connected:', address);
    } catch (error: any) {
      console.error('Failed to connect wallet:', error);
      setState(prev => ({
        ...prev,
        isConnecting: false,
        error: error.message || 'Failed to connect wallet',
      }));
    }
  }, []);

  const disconnect = useCallback(() => {
    setState({
      isConnected: false,
      address: null,
      provider: null,
      signer: null,
      isConnecting: false,
      error: null,
    });
  }, []);

  // Check connection status on mount
  useEffect(() => {
    const checkConnection = async () => {
      if (typeof window === 'undefined' || !window.ethereum) {
        return;
      }

      try {
        // Get current accounts
        const accounts: string[] = await (window.ethereum as any).request({ method: 'eth_accounts' });
        if (accounts.length === 0) {
          // Request connection if not connected
          const requestedAccounts: string[] = await (window.ethereum as any).request({ method: 'eth_requestAccounts' });
          console.log('accounts', requestedAccounts);
        } else {
          console.log('accounts', accounts);
        }
        if (accounts.length > 0) {
          const provider = new ethers.BrowserProvider(window.ethereum as any);
          const signer = await provider.getSigner();
          const address = await signer.getAddress();
          
          setState(prev => ({
            ...prev,
            isConnected: true,
            address,
            provider,
            signer,
          }));
        }
      } catch (error) {
        console.error('Error checking wallet connection:', error);
      }
    };

    checkConnection();

    // Listen for account changes
    const handleAccountsChanged = (accounts: string[]) => {
      if (accounts.length === 0) {
        disconnect();
      } else {
        setState(prev => ({ ...prev, address: accounts[0] }));
      }
    };

    const handleChainChanged = () => {
      window.location.reload();
    };

    if (window.ethereum) {
      (window.ethereum as any).on('accountsChanged', handleAccountsChanged);
      (window.ethereum as any).on('chainChanged', handleChainChanged);

      return () => {
        (window.ethereum as any).removeListener('accountsChanged', handleAccountsChanged);
        (window.ethereum as any).removeListener('chainChanged', handleChainChanged);
      };
    }
  }, [disconnect]);

  return {
    ...state,
    connect,
    disconnect,
  };
}; 