import React, { useEffect, useState, useRef, useCallback } from 'react';
import styled from 'styled-components';
import { isIOS, isAndroid } from '../../utils/deviceDetection';
import { useAppKitAccount } from '../config';
import { getNonce, verifySignature } from '@/app/api/auth';
import { useSignMessage } from 'wagmi';
const TOKEN_KEY = 'cryptogoals_auth_token';

const Container = styled.div`
  position: fixed;
  bottom: 20px;
  left: 20px;
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

const Row = styled.div`
  margin-bottom: 5px;
  word-break: break-all;
`;

const LogSection = styled.div`
  margin-top: 10px;
  padding-top: 10px;
  border-top: 1px solid rgba(255, 255, 255, 0.2);
`;

const ErrorRow = styled(Row)`
  color: #ff6b6b;
  background: rgba(255, 107, 107, 0.1);
  padding: 5px;
  border-radius: 3px;
  margin: 3px 0;
`;

// Maximum number of logs to keep in state
const MAX_LOGS = 10;

const WebViewLogger: React.FC<{ visible?: boolean }> = ({ visible = false }) => {
  const [isVisible, setIsVisible] = useState(visible);
  // Use refs for log collections to avoid excessive re-renders
  const logsRef = useRef<string[]>([]);
  const errorLogsRef = useRef<string[]>([]);
  const authLogsRef = useRef<string[]>([]);
  const isAuthenticating = useRef(false);
  
  // Only update the state for rendering when needed
  const [logs, setLogs] = useState<string[]>([]);
  const [errorLogs, setErrorLogs] = useState<string[]>([]);
  const [authLogs, setAuthLogs] = useState<string[]>([]);
  
  const [webViewInfo, setWebViewInfo] = useState<{
    isWebView: boolean;
    userAgent: string;
    platform: string;
    vendor: string;
  }>({
    isWebView: false,
    userAgent: '',
    platform: '',
    vendor: ''
  });
  
  const { signMessageAsync } = useSignMessage();
  const { address, isConnected } = useAppKitAccount();
  
  // Use throttled update to prevent excessive renders
  const throttleUpdateTimerRef = useRef<NodeJS.Timeout | null>(null);
  
  const updateVisibleLogs = useCallback(() => {
    if (isVisible) {
      setLogs([...logsRef.current].slice(-MAX_LOGS));
      setErrorLogs([...errorLogsRef.current].slice(-MAX_LOGS));
      setAuthLogs([...authLogsRef.current].slice(-MAX_LOGS));
    }
  }, [isVisible]);
  
  const throttledUpdate = useCallback(() => {
    if (throttleUpdateTimerRef.current) {
      clearTimeout(throttleUpdateTimerRef.current);
    }
    
    throttleUpdateTimerRef.current = setTimeout(() => {
      updateVisibleLogs();
      throttleUpdateTimerRef.current = null;
    }, 500); // Update at most every 500ms
  }, [updateVisibleLogs]);
  
  const addLog = useCallback((message: string, isError = false, isAuth = false) => {
    if (!isVisible && !logsRef.current.length) return; // Don't log if not visible and no logs yet
    
    // Limit size of arrays to prevent memory issues
    if (logsRef.current.length > MAX_LOGS * 2) {
      logsRef.current = logsRef.current.slice(-MAX_LOGS);
    }
    
    logsRef.current.push(message);
    
    if (isError) {
      if (errorLogsRef.current.length > MAX_LOGS * 2) {
        errorLogsRef.current = errorLogsRef.current.slice(-MAX_LOGS);
      }
      errorLogsRef.current.push(message);
    }
    
    if (isAuth) {
      if (authLogsRef.current.length > MAX_LOGS * 2) {
        authLogsRef.current = authLogsRef.current.slice(-MAX_LOGS);
      }
      authLogsRef.current.push(message);
    }
    
    throttledUpdate();
  }, [isVisible, throttledUpdate]);

  const handleSignTransaction = useCallback(async (address: string | undefined) => {
    if (!address || isAuthenticating.current) return;

    try {
      isAuthenticating.current = true;
      const nonce = await getNonce(address);
      const message = `Sign this message to authenticate with My Odyssey. Nonce: ${nonce}`;
      addLog(message, false, true);
      const signature = await signMessageAsync({ message });
      addLog("Web view logger signing", false, true);
      const { token } = await verifySignature(address, signature, nonce);
      localStorage.setItem(TOKEN_KEY, token);
      addLog('Authentication successful', false, true);
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      addLog(`Error during authentication: ${errorMsg}`, true, true);
    } finally {
      isAuthenticating.current = false;
    }
  }, [signMessageAsync, addLog]);

  // Initialize only once
  useEffect(() => {
    if (typeof navigator === 'undefined') return;
    
    const userAgent = navigator.userAgent.toLowerCase();
    const isWebView = userAgent.includes('wv') || 
                      (isIOS() && userAgent.includes('safari') && !userAgent.includes('chrome')) ||
                      (isAndroid() && userAgent.includes('version/'));
    
    setWebViewInfo({
      isWebView,
      userAgent: navigator.userAgent,
      platform: navigator.platform,
      vendor: navigator.vendor
    });
    
    // Only override console methods if logger is visible or will be visible
    if (visible) {
      const originalConsoleLog = console.log;
      const originalConsoleError = console.error;
      const originalConsoleWarn = console.warn;

      console.log = (...args) => {
        originalConsoleLog.apply(console, args);
        
        // Skip processing if logger not visible
        if (!isVisible && logsRef.current.length === 0) return;
        
        const logMessage = args.map(arg => 
          typeof arg === 'object' ? JSON.stringify(arg, null, 2).substring(0, 200) : String(arg)
        ).join(' ');
        
        // Track authentication-related logs
        const isAuthLog = logMessage.toLowerCase().includes('auth') || 
          logMessage.toLowerCase().includes('sign') || 
          logMessage.toLowerCase().includes('wallet') ||
          logMessage.toLowerCase().includes('connect');
        
        addLog(logMessage, false, isAuthLog);
      };

      console.error = (...args) => {
        originalConsoleError.apply(console, args);
        
        // Skip processing if logger not visible
        if (!isVisible && errorLogsRef.current.length === 0) return;
        
        const errorMessage = args.map(arg => {
          if (arg instanceof Error) {
            return `${arg.name}: ${arg.message}`.substring(0, 200);
          }
          return typeof arg === 'object' ? JSON.stringify(arg, null, 2).substring(0, 200) : String(arg);
        }).join(' ');
        
        addLog(errorMessage, true, true);
      };

      console.warn = (...args) => {
        originalConsoleWarn.apply(console, args);
        
        // Skip processing if logger not visible
        if (!isVisible && errorLogsRef.current.length === 0) return;
        
        const warnMessage = args.map(arg => 
          typeof arg === 'object' ? JSON.stringify(arg, null, 2).substring(0, 200) : String(arg)
        ).join(' ');
        
        addLog(`WARNING: ${warnMessage}`, true, false);
      };

      // Only add minimal error handlers
      const handleError = (event: ErrorEvent) => {
        const errorMessage = `${event.error?.name || 'Error'}: ${event.message}`.substring(0, 200);
        addLog(errorMessage, true, true);
      };

      window.addEventListener('error', handleError);

      return () => {
        console.log = originalConsoleLog;
        console.error = originalConsoleError;
        console.warn = originalConsoleWarn;
        window.removeEventListener('error', handleError);
      };
    }
  }, [visible, isVisible, addLog]);

  // Track wallet connection state
  useEffect(() => {
    if (isConnected && !isAuthenticating.current) {
      addLog(`Wallet connected: ${address}`, false, true);
      handleSignTransaction(address);
    }
  }, [isConnected, address, handleSignTransaction]);

  // Update visible logs when visibility changes
  useEffect(() => {
    if (isVisible) {
      updateVisibleLogs();
    }
  }, [isVisible, updateVisibleLogs]);

  if (!isVisible) {
    return (
      <button 
        onClick={() => setIsVisible(true)}
        style={{ 
          position: 'fixed',
          bottom: '10px',
          left: '10px',
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
        W
      </button>
    );
  }

  return (
    <Container>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
        <h4 style={{ margin: 0 }}>WebView Logger</h4>
        <button
          onClick={() => setIsVisible(false)}
          style={{
            background: 'none',
            border: 'none',
            color: 'white',
            cursor: 'pointer',
            fontSize: '16px'
          }}
        >
          ✕
        </button>
      </div>
      
      <Row><strong>Is WebView:</strong> {webViewInfo.isWebView ? 'Yes' : 'No'}</Row>
      <Row><strong>Platform:</strong> {webViewInfo.platform}</Row>
      
      <LogSection>
        <h5 style={{ margin: '0 0 5px' }}>Wallet Connection:</h5>
        <Row><strong>Connected:</strong> {isConnected ? 'Yes' : 'No'}</Row>
        {address && (
          <Row><strong>Address:</strong> {address.substring(0, 6)}...{address.substring(address.length - 4)}</Row>
        )}
      </LogSection>

      <LogSection>
        <h5 style={{ margin: '0 0 5px' }}>Auth Logs:</h5>
        {authLogs.map((log, index) => (
          <Row key={`auth-${index}`}>{log}</Row>
        ))}
      </LogSection>

      <LogSection>
        <h5 style={{ margin: '0 0 5px' }}>Errors:</h5>
        {errorLogs.map((log, index) => (
          <ErrorRow key={`error-${index}`}>{log}</ErrorRow>
        ))}
      </LogSection>
    </Container>
  );
};

export default React.memo(WebViewLogger); 