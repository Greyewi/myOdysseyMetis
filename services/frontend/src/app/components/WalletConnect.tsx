import { useAppKit, useDisconnect, useAppKitAccount } from '../config'
import { useSignMessage } from 'wagmi'
import styled from 'styled-components'
import { getNonce, verifySignature } from '../api/auth'
import { useEffect, useCallback, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { wagmiAdapter } from '../config'

const TOKEN_KEY = 'cryptogoals_auth_token';

const Button = styled.button`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0.4rem 0.8rem;
  background: #2196F3;
  color: white;
  text-decoration: none;
  border-radius: 8px;
  font-weight: 700;
  font-size: 16px;
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
  transition: all 0.2s ease;
  border: none;
  cursor: pointer;

  &:hover {
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(14, 165, 233, 0.2);
  }

  &:disabled {
    background: #cccccc;
    cursor: not-allowed;
    transform: none;
    box-shadow: none;
  }

  @media (max-width: 480px) {
    padding: 0.35rem 0.7rem;
    font-size: 14px;
  }
`

export function ActionButtonList() {
  const { open } = useAppKit();
  const { disconnect } = useDisconnect()
  const { isConnected, address } = useAppKitAccount()
  const { signMessageAsync } = useSignMessage({ config: wagmiAdapter.wagmiConfig })
  const navigate = useNavigate()
  const isAuthenticating = useRef(false);

  const token = localStorage.getItem(TOKEN_KEY);

  function openAppKit() {
    open();
  }

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

  // Only try to sign once when connected and without token
  useEffect(() => {
    let isMounted = true;
    const shouldSign = isConnected && address && !token && isMounted && !isAuthenticating.current;

    if (shouldSign) {
        handleSignTransaction(address);
    }

    // Cleanup function to prevent memory leaks
    return () => {
      isMounted = false;
    };
  }, [isConnected, address, token, handleSignTransaction]);

  async function handleDisconnect() {
    try {
      await disconnect()
      localStorage.clear()
      sessionStorage.clear()
      document.cookie.split(";").forEach(function(c) { 
        document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/"); 
      });
      if ('indexedDB' in window) {
        indexedDB.databases().then(databases => {
          databases.forEach(db => {
            if (db.name) {
              indexedDB.deleteDatabase(db.name);
            }
          });
        });
      }
      navigate('/');
    } catch (error) {
      console.error('Error during disconnect:', error)
    }
  }

  return (
    <div className="action-button-list">
      {!isConnected && !token ? (
        <Button onClick={openAppKit}>Connect Wallet</Button>
      ) : (
        <Button onClick={handleDisconnect}>Disconnect</Button>
      )}
    </div>
  )
}

export default ActionButtonList