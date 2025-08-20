import React, { useEffect, useState } from 'react';
import styled from 'styled-components';
import { useAppKit, useAppKitAccount, useAppKitState } from '../config';
import { isMobile, isIOS, isAndroid } from '../../utils/deviceDetection';

const Container = styled.div`
  position: fixed;
  bottom: 20px;
  right: 20px;
  background: rgba(0, 0, 0, 0.8);
  color: white;
  padding: 10px;
  border-radius: 5px;
  font-size: 12px;
  max-width: 300px;
  z-index: 1000;
  overflow-y: auto;
  max-height: 300px;
`;

const Button = styled.button`
  background: #007bff;
  color: white;
  border: none;
  padding: 5px 10px;
  margin-top: 10px;
  border-radius: 3px;
  cursor: pointer;
`;

const Row = styled.div`
  margin-bottom: 5px;
  word-break: break-all;
`;

const WalletDebugger: React.FC<{ visible?: boolean }> = ({ visible = false }) => {
  const [isVisible, setIsVisible] = useState(visible);
  const [userAgent, setUserAgent] = useState('');
  const appKit = useAppKit();
  const { address, isConnected } = useAppKitAccount();
  const state = useAppKitState();

  useEffect(() => {
    if (typeof navigator !== 'undefined') {
      setUserAgent(navigator.userAgent);
    }
  }, []);

  if (!isVisible) {
    return (
      <button 
        onClick={() => setIsVisible(true)}
        style={{ 
          position: 'fixed',
          bottom: '10px',
          right: '10px',
          background: 'rgba(0,0,0,0.5)',
          color: 'white',
          border: 'none',
          borderRadius: '50%',
          width: '30px',
          height: '30px',
          fontSize: '20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          zIndex: 1000
        }}
      >
        ?
      </button>
    );
  }

  return (
    <Container>
      <h4 style={{ margin: '0 0 10px' }}>Wallet Debugger</h4>
      
      <Row><strong>Mobile:</strong> {isMobile() ? 'Yes' : 'No'}</Row>
      <Row><strong>iOS:</strong> {isIOS() ? 'Yes' : 'No'}</Row>
      <Row><strong>Android:</strong> {isAndroid() ? 'Yes' : 'No'}</Row>
      <Row><strong>WC Modal Open:</strong> {state.open ? 'Yes' : 'No'}</Row>
      <Row><strong>Connected:</strong> {isConnected ? 'Yes' : 'No'}</Row>
      
      {address && (
        <Row><strong>Address:</strong> {address.substring(0, 6)}...{address.substring(address.length - 4)}</Row>
      )}
      
      <Row>
        <strong>UserAgent:</strong> {userAgent}
      </Row>
      
      <Button onClick={() => appKit.open()}>Open Modal</Button>
      <Button onClick={() => setIsVisible(false)} style={{ marginLeft: '10px', background: '#6c757d' }}>
        Close
      </Button>
    </Container>
  );
};

export default WalletDebugger; 