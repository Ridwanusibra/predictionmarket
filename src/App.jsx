import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { Activity } from 'lucide-react';
import { useWallet } from './context/WalletContext';
import { getAllMarkets } from './utils/contracts';
import LandingPage from './components/LandingPage';
import Header from './components/Header';
import MarketsDashboard from './components/MarketsDashboard';
import MarketDetail from './components/MarketDetail';
import UserProfile from './components/UserProfile';
import CreateMarket from './components/CreateMarket';

function App() {
  const { connected, provider, signer, connectWallet } = useWallet();
  const [currentPage, setCurrentPage] = useState('landing');
  const [selectedMarket, setSelectedMarket] = useState(null);
  const [markets, setMarkets] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Fetch markets from blockchain
  const fetchMarkets = async () => {
    if (!provider) return;
    
    setLoading(true);
    setError(null);
    
    try {
      console.log('Fetching markets from blockchain...');
      const realMarkets = await getAllMarkets(provider);
      console.log('Markets fetched:', realMarkets);
      setMarkets(realMarkets);
    } catch (err) {
      console.error('Error fetching markets:', err);
      setError('Failed to load markets. Please check your connection.');
    }
    
    setLoading(false);
  };

  // Initial fetch when wallet connects
  useEffect(() => {
    if (connected && provider) {
      fetchMarkets();
      setCurrentPage('markets');
    }
  }, [connected, provider]);

  // Auto-refresh every 5 seconds
  useEffect(() => {
    if (!connected || !provider) return;
    
    const interval = setInterval(() => {
      fetchMarkets();
    }, 5000);
    
    return () => clearInterval(interval);
  }, [connected, provider]);

  const handleConnect = async () => {
    await connectWallet();
  };

  const handleSelectMarket = (market) => {
    setSelectedMarket(market);
  };

  const handleCloseMarket = () => {
    setSelectedMarket(null);
  };

  const handleUpdateMarket = async () => {
    await fetchMarkets();
  };

  const handleMarketCreated = async () => {
    console.log('New market created, refreshing list...');
    await fetchMarkets();
    setCurrentPage('markets');
  };

  // Landing page
  if (!connected && currentPage === 'landing') {
    return <LandingPage onConnect={handleConnect} />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header 
        onNavigate={setCurrentPage} 
        currentPage={currentPage}
      />
      
      {loading && markets.length === 0 && currentPage === 'markets' && (
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <Activity className="w-12 h-12 text-purple-600 animate-spin mx-auto mb-4" />
            <p className="text-gray-600">Loading markets from blockchain...</p>
          </div>
        </div>
      )}

      {error && currentPage === 'markets' && (
        <div className="container mx-auto px-4 py-8">
          <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
            <p className="text-red-800 mb-4">{error}</p>
            <button
              onClick={fetchMarkets}
              className="bg-red-600 text-white px-6 py-2 rounded-lg hover:bg-red-700 transition"
            >
              Retry
            </button>
          </div>
        </div>
      )}

      {!loading && !error && (
        <>
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

          {currentPage === 'create' && (
            <CreateMarket
              onMarketCreated={handleMarketCreated}
            />
          )}
        </>
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
}

export default App;