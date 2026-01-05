import React, { useState, useEffect, createContext, useContext } from 'react';
import { Wallet, TrendingUp, Users, Clock, Activity, ArrowRight, Sparkles, Shield, Zap, ExternalLink, RefreshCw } from 'lucide-react';

// ============= WALLET CONTEXT =============
const WalletContext = createContext();

const WalletProvider = ({ children }) => {
  const [connected, setConnected] = useState(false);
  const [address, setAddress] = useState('');
  const [provider, setProvider] = useState(null);
  const [signer, setSigner] = useState(null);
  const [autoConnectChecked, setAutoConnectChecked] = useState(false);

  // Check for auto-connect on mount
  useEffect(() => {
    const shouldAutoConnect = localStorage.getItem('walletConnected');
    if (shouldAutoConnect === 'true' && !autoConnectChecked) {
      connectWallet(true);
    }
    setAutoConnectChecked(true);
  }, []);

  const connectWallet = async (isAutoConnect = false) => {
    try {
      if (typeof window.ethereum === 'undefined') {
        alert('Please install MetaMask!');
        return;
      }

      const accounts = await window.ethereum.request({
        method: 'eth_requestAccounts'
      });

      const addr = accounts[0];
      setAddress(addr);
      setConnected(true);
      
      // Remember connection
      if (!isAutoConnect) {
        localStorage.setItem('walletConnected', 'true');
      }

      // Listen for account changes
      window.ethereum.on('accountsChanged', (accounts) => {
        if (accounts.length === 0) {
          disconnectWallet();
        } else {
          setAddress(accounts[0]);
        }
      });

      window.ethereum.on('chainChanged', () => {
        window.location.reload();
      });

    } catch (error) {
      console.error('Wallet connection error:', error);
      alert('Failed to connect wallet');
    }
  };

  const disconnectWallet = () => {
    setConnected(false);
    setAddress('');
    setProvider(null);
    setSigner(null);
    localStorage.removeItem('walletConnected');
  };

  return (
    <WalletContext.Provider value={{
      connected,
      address,
      provider,
      signer,
      connectWallet,
      disconnectWallet
    }}>
      {children}
    </WalletContext.Provider>
  );
};

const useWallet = () => useContext(WalletContext);

export { WalletProvider, useWallet };