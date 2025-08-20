import React, { useState } from 'react';
import { useAppKitAccount, useAppKitNetwork, useAppKit } from '@reown/appkit/react';
import { useSignMessage } from 'wagmi';
import styled from 'styled-components';
import { getNonce, verifySignature } from '../api/auth';

const TOKEN_KEY = 'cryptogoals_auth_token';

const Button = styled.button`
  padding: 10px 20px;
  border-radius: 8px;
  background-color: #4CAF50;
  color: white;
  border: none;
  cursor: pointer;
  font-size: 16px;
  margin: 10px;
  transition: background-color 0.3s;

  &:hover {
    background-color: #45a049;
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
  gap: 10px;
  padding: 20px;
`;

export const SignTransaction: React.FC = () => {
  const { address, isConnected } = useAppKitAccount();
  const { chainId } = useAppKitNetwork();
  const appKit = useAppKit();
  const { signMessageAsync } = useSignMessage();
  const [isLoading, setIsLoading] = useState(false);

  const handleSignTransaction = async () => {
    if (!isConnected || !address) return;

    try {
      setIsLoading(true);
      const nonce = await getNonce(address);
      const message = `Sign this message to authenticate with My Odyssey. Nonce: ${nonce}`;
      const signature = await signMessageAsync({ message });
      const { token } = await verifySignature(address, signature, nonce);
      
      // Save the token to localStorage
      localStorage.setItem(TOKEN_KEY, token);
      
    } catch (error) {
      console.error('Error during authentication:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Container>
      <h3>Sign Message</h3>
      {isConnected ? (
        <>
          <p>Connected to: {address}</p>
          <p>Network: {chainId}</p>
          <Button onClick={handleSignTransaction} disabled={isLoading}>
            {isLoading ? 'Signing...' : 'Sign Message'}
          </Button>
        </>
      ) : (
        <p>Please connect your wallet first</p>
      )}
    </Container>
  );
}; 