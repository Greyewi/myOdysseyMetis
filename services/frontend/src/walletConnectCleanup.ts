/**
 * Utility to clean up conflicting WalletConnect subscriptions
 */
export function cleanupWalletConnect() {
  if (typeof window === 'undefined') return;

  try {
    // Fix relay URL if incorrect
    // This patches any erroneous relay URL used by WalletConnect in the app
    if (window.localStorage.getItem('wc@2:client:0:relayUrl') === 'wss://relay.walletconnect.org') {
      window.localStorage.setItem('wc@2:client:0:relayUrl', 'wss://relay.walletconnect.com');
    }
    
    // Clear subscription data from localStorage
    const wcKeys = Object.keys(localStorage).filter(key => 
      key.startsWith('wc@') || 
      key.includes('walletconnect') ||
      key.includes('subscription') ||
      key.includes('topic')
    );
    
    wcKeys.forEach(key => {
      try {
        // Don't remove our fixed relay URL
        if (key === 'wc@2:client:0:relayUrl') {
          localStorage.setItem(key, 'wss://relay.walletconnect.com');
        } else {
          localStorage.removeItem(key);
        }
        console.log(`Removed WalletConnect key: ${key}`);
      } catch (e) {
        console.warn(`Failed to remove key ${key}`);
      }
    });
    
    // Save the correct relay URL
    localStorage.setItem('wc@2:client:0:relayUrl', 'wss://relay.walletconnect.com');
    
    // Special handling for specific subscription topics from the error
    const specificTopics = [
      '8683d2c118be84b7af52e26f7a94018b132521e119086fed796a8acff2c4be5b',
      '7c8efee19905345523696a8d290d434828fc3c618d026e77bfcbe69502bcc25b'
    ];
    
    specificTopics.forEach(topic => {
      try {
        localStorage.removeItem(`wc@2:client:0:${topic}`);
        localStorage.removeItem(`wc@2:subscription:0:${topic}`);
      } catch (e) {
        // Ignore errors
      }
    });
    
    // Additional mobile-specific cleanup
    if (/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)) {
      // Clear session cache for mobile browsers
      try {
        sessionStorage.clear();
        // Clear any pending WalletConnect sessions
        Object.keys(sessionStorage).filter(key => 
          key.includes('walletconnect') || key.includes('wc')
        ).forEach(key => sessionStorage.removeItem(key));
      } catch (e) {
        console.warn('Error clearing session storage:', e);
      }
    }
    
    console.log('WalletConnect cleanup completed');
  } catch (e) {
    console.warn('Error during cleanup:', e);
  }
}

// Auto-execute when imported
cleanupWalletConnect(); 