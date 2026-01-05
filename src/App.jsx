import React, { useState, useEffect } from 'react';
import { useWallet } from './context/WalletContext'; // make sure path is correct
import LandingPage from './components/LandingPage'; // your landing page component
import Header from './components/Header';           // your site header
import MarketsDashboard from './components/MarketsDashboard';
import UserProfile from './components/UserProfile';
import MarketDetail from './components/MarketDetail'; // modal/detail view
import MOCK_MARKETS from './mockData'; // replace with your mock or real data

// ============= MAIN APP =============
const App = () => {
  const { connected, connectWallet } = useWallet();
  const [currentPage, setCurrentPage] = useState('landing');
  const [selectedMarket, setSelectedMarket] = useState(null);
  const [markets, setMarkets] = useState(MOCK_MARKETS);

  useEffect(() => {
    if (connected && currentPage === 'landing') {
      setCurrentPage('markets');
    }
  }, [connected]);

  const handleConnect = () => {
    connectWallet();
  };

  const handleSelectMarket = (market) => {
    setSelectedMarket(market);
  };

  const handleCloseMarket = () => {
    setSelectedMarket(null);
  };

  const handleUpdateMarket = () => {
    // In production, this would fetch fresh data from blockchain
    setMarkets([...markets]);
  };

  if (!connected && currentPage === 'landing') {
    return <LandingPage onConnect={handleConnect} />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header 
        onNavigate={setCurrentPage} 
        currentPage={currentPage}
      />
      
      {currentPage === 'markets' && (
        <MarketsDashboard
          markets={markets}
          onSelectMarket={handleSelectMarket}
        />
      )}
      
      {currentPage === 'profile' && (
        <UserProfile
          markets={markets}
          onViewMarket={handleSelectMarket}
          onUpdate={handleUpdateMarket}
        />
      )}

      {selectedMarket && (
        <MarketDetail
          market={selectedMarket}
          onClose={handleCloseMarket}
          onUpdate={handleUpdateMarket}
        />
      )}
    </div>
  );
};

export default App;