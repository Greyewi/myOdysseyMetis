import React, { useEffect, useState } from 'react';
import styled from 'styled-components';
import { QRCodeSVG } from 'qrcode.react';
import { ethers } from 'ethers';
import { WalletNetwork } from '../../types/goals';

const WalletInfoContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

const NetworkBadge = styled.div`
  display: inline-block;
  background: #1f2937;
  color: white;
  padding: 0.5rem 1rem;
  border-radius: 6px;
  font-weight: 600;
  font-size: 0.875rem;
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  align-self: flex-start;
  border: 1px solid #374151;
`;

const WalletAddress = styled.div`
  display: flex;
  align-items: center;
  gap: 1.5rem;
  padding: 1.5rem;
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
`;

const AddressText = styled.p`
  margin: 0;
  font-family: monospace;
  word-break: break-all;
`;

const QRCodeContainer = styled.div`
  background: white;
  padding: 0.5rem;
  border-radius: 4px;
`;

const CopyButton = styled.button`
  background: none;
  border: none;
  color: #2196F3;
  cursor: pointer;
  padding: 0.25rem 0.5rem;
  font-size: 0.875rem;
  margin-left: 0.5rem;
  
  &:hover {
    text-decoration: underline;
  }
`;

const EditButton = styled.button`
  background: transparent;
  border: 2px solid #f59e0b;
  color: #f59e0b;
  cursor: pointer;
  padding: 0.5rem 1rem;
  border-radius: 6px;
  font-size: 0.875rem;
  font-weight: 500;
  transition: all 0.2s ease;
  width: fit-content;
  
  &:hover {
    background: #f59e0b;
    color: white;
  }
`;

const RefundAddressSection = styled.div`
  padding: 1rem;
  border-radius: 12px;
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

const RefundAddressHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-weight: 600;
  color: #92400e;
`;

const RefundAddressContent = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
`;

const RefundAddressInput = styled.input`
  width: 100%;
  padding: 0.75rem 1rem;
  margin-top: 0.5rem;
  border: 2px solid #e2e8f0;
  border-radius: 8px;
  font-family: monospace;
  font-size: 0.875rem;
  
  &:focus {
    outline: none;
    border-color: #f59e0b;
    box-shadow: 0 0 0 3px rgba(245, 158, 11, 0.1);
  }
`;

const SaveButton = styled.button`
  background: #2196F3;
  color: white;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 4px;
  cursor: pointer;
  
  &:hover {
    opacity: 0.9;
  }
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: 0.75rem;
  margin-top: 1rem;
`;

const BalanceSection = styled.div`
  padding: 1rem;
  border-radius: 12px;
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const Button = styled.button`
  background: #2196F3;
  color: white;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 4px;
  cursor: pointer;
  
  &:hover {
    opacity: 0.9;
  }
`;

interface WalletInfoProps {
  publicKey: string;
  network: WalletNetwork;
  lastBalance: string | null;
  lastBalanceUpdate?: Date | null;
  refundAddress?: string | null;
  onUpdateRefundAddress?: (address: string) => void;
  onUpdateBalance?: () => void;
}

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

const WalletInfo: React.FC<WalletInfoProps> = ({
  publicKey,
  network,
  lastBalance,
  lastBalanceUpdate,
  refundAddress,
  onUpdateRefundAddress,
  onUpdateBalance
}) => {
  const [newRefundAddress, setNewRefundAddress] = React.useState(refundAddress || '');
  const [isEditing, setIsEditing] = React.useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setNewRefundAddress(refundAddress || '');
  }, [refundAddress]);

  const handleCopyAddress = async () => {
    try {
      await navigator.clipboard.writeText(publicKeyToAddress(publicKey));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (e) {
      // Optionally handle error, but do not show alert
    }
  };

  const handleSave = async () => {
    if (!onUpdateRefundAddress) return;
    
    if (newRefundAddress === refundAddress) {
      setIsEditing(false);
      return;
    }

    try {
      await onUpdateRefundAddress(newRefundAddress);
      setIsEditing(false);
    } catch (error) {
      console.error('Failed to update refund address:', error);
    }
  };

  return (
    <WalletInfoContainer>
      <NetworkBadge>{network}</NetworkBadge>
      
      <WalletAddress>
        <QRCodeContainer>
          <QRCodeSVG
            value={publicKeyToAddress(publicKey)}
            size={100}
            level="H"
          />
        </QRCodeContainer>
        <div>
          <AddressText>
            {publicKeyToAddress(publicKey)}
            <CopyButton onClick={handleCopyAddress}>
              {copied ? 'Copied' : 'Copy'}
            </CopyButton>
          </AddressText>
          <p>Scan QR code to send funds</p>
        </div>
      </WalletAddress>
      
      <BalanceSection>
        <div>
          <strong>Balance:</strong> {lastBalance || '0'} {network}
          {lastBalanceUpdate && (
            <div style={{ fontSize: '0.875rem', color: '#64748b', marginTop: '0.25rem' }}>
              Last updated: {new Date(lastBalanceUpdate).toLocaleString()}
            </div>
          )}
        </div>
        {onUpdateBalance && (
          <Button onClick={onUpdateBalance}>
            Update Balance
          </Button>
        )}
      </BalanceSection>

      {onUpdateRefundAddress && (
        <RefundAddressSection>
          <RefundAddressHeader>
            💰 Refund Address
          </RefundAddressHeader>
          
          <RefundAddressContent>
            {isEditing ? (
              <>
                <RefundAddressInput
                  value={newRefundAddress}
                  onChange={(e) => setNewRefundAddress(e.target.value)}
                  placeholder="Enter refund address"
                />
                <ButtonGroup>
                  <SaveButton onClick={handleSave}>Save</SaveButton>
                  <Button onClick={() => setIsEditing(false)}>Cancel</Button>
                </ButtonGroup>
              </>
            ) : (
              <>
                <AddressText>
                  {refundAddress || 'Not set'}
                </AddressText>
                <EditButton onClick={() => setIsEditing(true)}>Edit</EditButton>
              </>
            )}
          </RefundAddressContent>
        </RefundAddressSection>
      )}
    </WalletInfoContainer>
  );
};

export default WalletInfo; 