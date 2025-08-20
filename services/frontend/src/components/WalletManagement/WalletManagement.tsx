import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { GoalWithWallet, WalletNetwork, GoalStatus } from '../../types/goals';
import { ethers } from 'ethers';
import WalletInfoComponent from '../WalletInfo/WalletInfo';
import { useGoals } from '../../provider/goalProvider';
import { getSupportedNetworks } from '../../utils/networkFilter';
import { RefundStatus, WalletEstimate } from '../../app/api/goals';

interface WalletManagementProps {
  goal: GoalWithWallet;
  onGoalUpdate: () => void;
}

const SUPPORTED_NETWORKS: WalletNetwork[] = getSupportedNetworks();

const Container = styled.div`
  padding: 0;
  background: transparent;
`;

const SectionTitle = styled.h3`
  color: #1B1F23;
  font-size: 1.5rem;
  font-weight: 600;
`;

const SubSectionTitle = styled.h4`
  color: #4a5568;
  font-size: 1.25rem;
  font-weight: 600;
  margin: 2rem 0 1rem 0;
`;

const WalletInfo = styled.div`
  margin-bottom: 1.5rem;
  padding: 1.5rem;
  background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
`;

const AddWalletSection = styled.div`
  margin-top: 2rem;
  padding: 1.5rem;
  background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
  border: 1px solid #bae6fd;
  border-radius: 12px;
`;

const NetworkSelect = styled.select`
  padding: 0.75rem 1rem;
  margin-right: 1rem;
  border: 2px solid #e2e8f0;
  border-radius: 8px;
  background: white;
  font-size: 1rem;
  color: #2d3748;
  transition: all 0.2s ease;
  
  &:focus {
    outline: none;
    border-color: #3b82f6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
  }
`;

const Button = styled.button<{ variant?: 'primary' | 'secondary' | 'danger' }>`
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 4px;
  font-weight: 500;
  cursor: pointer;
  background-color: ${props => {
    switch (props.variant) {
      case 'secondary':
        return '#9e9e9e';
      case 'danger':
        return '#f44336';
      default:
        return '#2196F3';
    }
  }};
  color: white;

  &:hover {
    opacity: 0.9;
  }

  &:disabled {
    background-color: #ccc;
    cursor: not-allowed;
  }
`;

const CreateWalletButton = styled(Button)`
  margin-top: 1rem;
`;

const RefundSection = styled.div`
  margin-top: 2rem;
  padding: 2rem;
  background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%);
  border: 2px solid #22c55e;
  border-radius: 16px;
  box-shadow: 0 4px 12px rgba(34, 197, 94, 0.1);
`;

const RefundButton = styled(Button)`
  background-color: #4CAF50;
  margin-top: 1rem;
  
  &:hover {
    background-color: #45a049;
  }

  &:disabled {
    background-color: #cccccc;
    cursor: not-allowed;
  }
`;

const RefundInfo = styled.div`
  margin-bottom: 1rem;
  font-size: 14px;
  color: #666;
`;

const RefundResults = styled.div`
  margin-top: 1.5rem;
  padding: 1.5rem;
  background: linear-gradient(135deg, #fefce8 0%, #fef3c7 100%);
  border: 1px solid #f59e0b;
  border-radius: 12px;
  font-size: 14px;
  box-shadow: 0 2px 4px rgba(245, 158, 11, 0.1);
`;

const GasEstimatesSection = styled.div`
  margin-top: 1.5rem;
  padding: 1.5rem;
  background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
  border-radius: 12px;
  border: 1px solid #e2e8f0;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
`;

const WalletEstimateCard = styled.div<{ hasError?: boolean }>`
  padding: 0.75rem;
  margin-bottom: 0.5rem;
  background-color: ${props => props.hasError ? '#fff5f5' : '#ffffff'};
  border: 1px solid ${props => props.hasError ? '#fed7d7' : '#e2e8f0'};
  border-radius: 4px;
  font-size: 13px;
`;

const EstimateRow = styled.div`
  display: flex;
  justify-content: space-between;
  margin-bottom: 0.25rem;
`;

const EstimateLabel = styled.span`
  color: #4a5568;
  font-weight: 500;
`;

const EstimateValue = styled.span<{ isError?: boolean; isSuccess?: boolean }>`
  color: ${props => {
    if (props.isError) return '#e53e3e';
    if (props.isSuccess) return '#38a169';
    return '#2d3748';
  }};
  font-weight: 600;
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

const WalletManagement: React.FC<WalletManagementProps> = ({ 
  goal, 
  onGoalUpdate 
}) => {
  const { updateGoalRefundAddress, createWallet, updateWalletBalance, processGoalRefund, getGoalRefundStatus } = useGoals();
  const [selectedNetwork, setSelectedNetwork] = useState<WalletNetwork | ''>('');
  const [refundStatus, setRefundStatus] = useState<RefundStatus | null>(null);
  const [isRefunding, setIsRefunding] = useState(false);
  const [refundResults, setRefundResults] = useState<any>(null);

  // Get available networks (ones not already used)
  const availableNetworks = SUPPORTED_NETWORKS.filter(
    network => !goal.wallets?.some(wallet => wallet.network === network)
  );

  // Fetch refund status when goal is completed
  useEffect(() => {
    if (goal.status === GoalStatus.COMPLETED) {
      getGoalRefundStatus(goal.id)
        .then(setRefundStatus)
        .catch(error => {
          console.error('Failed to fetch refund status:', error);
        });
    }
  }, [goal.status, goal.id, getGoalRefundStatus]);

  const handleCopyAddress = async (publicKey: string) => {
    const address = publicKeyToAddress(publicKey);
    try {
      await navigator.clipboard.writeText(address);
      alert('Address copied to clipboard!');
    } catch (err) {
      console.error('Failed to copy address:', err);
    }
  };

  const handleRefundAddressUpdate = async (address: string, walletId: number) => {
    if (!goal) return;
    try {
      await updateGoalRefundAddress(goal.id, walletId, address);
      onGoalUpdate();
    } catch (error) {
      console.error('Failed to update refund address:', error);
    }
  };

  const handleCreateWallet = async () => {
    try {
      await createWallet(goal.id, selectedNetwork as WalletNetwork);
      setSelectedNetwork('');
      onGoalUpdate();
    } catch (error) {
      console.error('Failed to create wallet:', error);
      // Handle error appropriately
    }
  };

  const handleUpdateBalance = async (walletId: number) => {
    try {
      await updateWalletBalance(walletId);
      onGoalUpdate();
    } catch (error) {
      console.error('Failed to update balance:', error);
    }
  };

  const handleProcessRefund = async () => {
    if (!goal || goal.status !== GoalStatus.COMPLETED) return;

    setIsRefunding(true);
    setRefundResults(null);

    try {
      const result = await processGoalRefund(goal.id);
      setRefundResults(result);
      
      // Update the goal data to reflect balance changes
      onGoalUpdate();
      
      // Refresh refund status
      const updatedStatus = await getGoalRefundStatus(goal.id);
      setRefundStatus(updatedStatus);

    } catch (error) {
      console.error('Failed to process refund:', error);
      alert(`Failed to process refund: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsRefunding(false);
    }
  };

  return (
    <Container>
      <SectionTitle>💳 Custodial wallet</SectionTitle>
      
      {goal.wallets?.map((wallet) => (
        <WalletInfo key={wallet.id}>
          <WalletInfoComponent
            publicKey={wallet.publicKey}
            network={wallet.network}
            lastBalance={wallet.lastBalance || null}
            lastBalanceUpdate={wallet.lastBalanceUpdate}
            refundAddress={wallet.refundAddress || ''}
            onUpdateRefundAddress={(address) => handleRefundAddressUpdate(address, wallet.id)}
            onUpdateBalance={() => handleUpdateBalance(wallet.id)}
          />
        </WalletInfo>
      ))}

      {availableNetworks.length > 0 && (
        <AddWalletSection>
          <SubSectionTitle>➕ Add New Wallet</SubSectionTitle>
          <NetworkSelect
            value={selectedNetwork}
            onChange={(e) => setSelectedNetwork(e.target.value as WalletNetwork)}
          >
            <option value="" disabled>Choose network</option>
            {availableNetworks.map((network) => (
              <option key={network} value={network}>
                {network}
              </option>
            ))}
          </NetworkSelect>
          <CreateWalletButton 
            onClick={handleCreateWallet}
            disabled={!selectedNetwork}
          >
            Create Wallet
          </CreateWalletButton>
        </AddWalletSection>
      )}  

      {/* Refund Section - Only show for completed goals */}
      {goal.status === GoalStatus.COMPLETED && (
        <RefundSection>
          <h4>🔄 Refund Available</h4>
          {refundStatus ? (
            <>
              <RefundInfo>
                <p>Your goal is completed! You can now refund your deposited funds.</p>
                <p><strong>Eligible wallets:</strong> {refundStatus.walletsWithRefundAddress} of {refundStatus.totalWallets}</p>
                <p><strong>Total estimated refund:</strong> {parseFloat(refundStatus.estimatedRefundAmount).toFixed(4)} tokens</p>
                {refundStatus.walletsWithRefundAddress === 0 && (
                  <p style={{ color: '#ff6b6b' }}>
                    ⚠️ No wallets have refund addresses set. Please set refund addresses for your wallets first.
                  </p>
                )}
              </RefundInfo>

              {/* Gas Estimates Section */}
              {refundStatus.walletEstimates && refundStatus.walletEstimates.length > 0 && (
                <GasEstimatesSection>
                  <h5 style={{ margin: '0 0 1rem 0', color: '#2d3748' }}>💰 Gas Fee Estimates</h5>
                  {refundStatus.walletEstimates.map((estimate) => (
                    <WalletEstimateCard key={estimate.walletId} hasError={estimate.hasInsufficientBalance}>
                      <div style={{ fontWeight: 'bold', marginBottom: '0.5rem', color: '#2d3748' }}>
                        Wallet {estimate.walletId} ({estimate.network})
                      </div>
                      
                      <EstimateRow>
                        <EstimateLabel>Current Balance:</EstimateLabel>
                        <EstimateValue>{parseFloat(estimate.currentBalance).toFixed(6)} {estimate.network}</EstimateValue>
                      </EstimateRow>
                      
                      <EstimateRow>
                        <EstimateLabel>Gas Fee:</EstimateLabel>
                        <EstimateValue>{parseFloat(estimate.gasFee).toFixed(6)} {estimate.network}</EstimateValue>
                      </EstimateRow>
                      
                      <EstimateRow>
                        <EstimateLabel>You'll Receive:</EstimateLabel>
                        <EstimateValue 
                          isError={estimate.hasInsufficientBalance}
                          isSuccess={!estimate.hasInsufficientBalance}
                        >
                          {estimate.hasInsufficientBalance ? '0' : parseFloat(estimate.maxSendableAmount).toFixed(6)} {estimate.network}
                        </EstimateValue>
                      </EstimateRow>
                      
                      {estimate.errorMessage && (
                        <div style={{ 
                          marginTop: '0.5rem', 
                          color: '#e53e3e', 
                          fontSize: '12px',
                          fontStyle: 'italic'
                        }}>
                          ⚠️ {estimate.errorMessage}
                        </div>
                      )}
                    </WalletEstimateCard>
                  ))}
                  
                  <div style={{ 
                    fontSize: '12px', 
                    color: '#718096', 
                    marginTop: '0.5rem',
                    fontStyle: 'italic'
                  }}>
                    * Gas fees are estimated and may vary based on network conditions
                  </div>
                </GasEstimatesSection>
              )}
              
              <RefundButton
                onClick={handleProcessRefund}
                disabled={isRefunding || !refundStatus.eligible || refundStatus.walletsWithRefundAddress === 0}
              >
                {isRefunding ? 'Processing Refund...' : 'Process Refund'}
              </RefundButton>
            </>
          ) : (
            <RefundInfo>
              <p>Loading refund status...</p>
            </RefundInfo>
          )}

          {refundResults && (
            <RefundResults>
              <h5>Refund Results:</h5>
              <p><strong>Total:</strong> {refundResults.totalRefunds}</p>
              <p><strong>Successful:</strong> {refundResults.successfulRefunds}</p>
              <p><strong>Failed:</strong> {refundResults.failedRefunds}</p>
              
              {refundResults.results && refundResults.results.length > 0 && (
                <div>
                  <h6>Details:</h6>
                  {refundResults.results.map((result: any, index: number) => (
                    <div key={index} style={{ 
                      marginBottom: '0.5rem', 
                      padding: '0.5rem', 
                      backgroundColor: result.success ? '#d4edda' : '#f8d7da',
                      borderRadius: '4px' 
                    }}>
                      <p><strong>Wallet {result.walletId} ({result.network}):</strong></p>
                      {result.success ? (
                        <div>
                          <p>✅ Success! Amount: {result.amount}</p>
                          <p>Transaction: {result.txHash}</p>
                          <p>Sent to: {result.refundAddress}</p>
                        </div>
                      ) : (
                        <p>❌ Failed: {result.error}</p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </RefundResults>
          )}
        </RefundSection>
      )}
    </Container>
  );
};

export default WalletManagement; 