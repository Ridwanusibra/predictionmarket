import React, { useEffect, useState } from 'react';
import { useWallet } from '../context/WalletContext';
import { getUserPositions, claimWinnings } from '../utils/contracts';
import { Wallet, Activity, RefreshCw, ExternalLink, Sparkles } from 'lucide-react';

const UserProfile = ({ onViewMarket, onUpdate }) => {
  const { address, provider, signer, disconnectWallet, connected } = useWallet();
  const [positions, setPositions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [claiming, setClaiming] = useState({});
  const [error, setError] = useState(null);

  // Fetch user's positions from blockchain
  const loadUserPositions = async () => {
    if (!provider || !signer || !connected) return;
    
    setLoading(true);
    setError(null);
    
    try {
      console.log('Fetching user positions...');
      const userPositions = await getUserPositions(provider, signer);
      console.log('User positions:', userPositions);
      setPositions(userPositions);
    } catch (err) {
      console.error('Error fetching positions:', err);
      setError('Failed to load your positions');
    }
    
    setLoading(false);
  };

  // Initial load
  useEffect(() => {
    if (connected && provider && signer) {
      loadUserPositions();
    }
  }, [connected, provider, signer]);

  // Auto-refresh every 5 seconds
  useEffect(() => {
    if (!connected) return;
    
    const interval = setInterval(() => {
      loadUserPositions();
    }, 5000);
    
    return () => clearInterval(interval);
  }, [connected, provider, signer]);

  // Handle claim winnings
  const handleClaim = async (marketAddress) => {
    if (!signer) return;
    
    setClaiming(prev => ({ ...prev, [marketAddress]: true }));
    
    try {
      console.log('Claiming from market:', marketAddress);
      await claimWinnings(marketAddress, signer);
      alert('Successfully claimed winnings! 🎉');
      await loadUserPositions();
      if (onUpdate) onUpdate();
    } catch (err) {
      console.error('Claim error:', err);
      alert('Failed to claim: ' + (err.message || 'Unknown error'));
    }
    
    setClaiming(prev => ({ ...prev, [marketAddress]: false }));
  };

  // Calculate totals
  const totalValue = positions.reduce((sum, p) => {
    const yesValue = p.yesBalance * p.yesPrice;
    const noValue = p.noBalance * p.noPrice;
    return sum + yesValue + noValue;
  }, 0);

  const totalLPValue = positions.reduce((sum, p) => {
    return sum + (p.lpShares * 2); // Simplified LP value
  }, 0);

  const totalClaimable = positions.reduce((sum, p) => {
    if (!p.resolved) return sum;
    const winningBalance = p.outcome ? p.yesBalance : p.noBalance;
    return sum + winningBalance;
  }, 0);

  if (!connected) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Wallet className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-700 mb-2">Connect Your Wallet</h2>
          <p className="text-gray-600">Please connect your wallet to view your portfolio</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 max-w-6xl">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 to-pink-600 rounded-3xl p-8 text-white mb-8 shadow-xl">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h1 className="text-4xl font-bold mb-2">Your Portfolio</h1>
              <p className="text-white/80">
                {address?.slice(0, 8)}...{address?.slice(-6)}
              </p>
            </div>
            <button
              onClick={disconnectWallet}
              className="bg-white/20 backdrop-blur-lg hover:bg-white/30 text-white px-6 py-3 rounded-xl font-semibold transition flex items-center gap-2 border border-white/30"
            >
              <Wallet className="w-4 h-4" />
              Disconnect
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-5 border border-white/20">
              <div className="text-white/80 text-sm mb-2">Total Token Value</div>
              <div className="text-3xl font-bold">${totalValue.toFixed(2)}</div>
            </div>
            <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-5 border border-white/20">
              <div className="text-white/80 text-sm mb-2">LP Position Value</div>
              <div className="text-3xl font-bold">${totalLPValue.toFixed(2)}</div>
            </div>
            <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-5 border border-white/20">
              <div className="text-white/80 text-sm mb-2">Claimable Winnings</div>
              <div className="text-3xl font-bold text-yellow-300">${totalClaimable.toFixed(2)}</div>
            </div>
          </div>
        </div>

        {/* Auto-refresh indicator */}
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">Your Positions</h2>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <RefreshCw className={`w-4 h-4 text-green-600 ${loading ? 'animate-spin' : ''}`} />
              {loading ? 'Updating...' : 'Live updates every 5s'}
            </div>
            <button
              onClick={loadUserPositions}
              disabled={loading}
              className="text-purple-600 hover:text-purple-700 font-medium text-sm disabled:opacity-50"
            >
              Refresh Now
            </button>
          </div>
        </div>

        {/* Loading State */}
        {loading && positions.length === 0 && (
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <Activity className="w-12 h-12 text-purple-600 animate-spin mx-auto mb-4" />
              <p className="text-gray-600">Loading your positions...</p>
            </div>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center mb-6">
            <p className="text-red-800 mb-4">{error}</p>
            <button
              onClick={loadUserPositions}
              className="bg-red-600 text-white px-6 py-2 rounded-lg hover:bg-red-700 transition"
            >
              Try Again
            </button>
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && positions.length === 0 && (
          <div className="bg-white rounded-2xl p-12 text-center shadow-lg">
            <Activity className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-gray-700 mb-2">No Positions Yet</h3>
            <p className="text-gray-600 mb-6">
              Start trading on prediction markets to see your positions here
            </p>
          </div>
        )}

        {/* Positions List */}
        {!loading && !error && positions.length > 0 && (
          <div className="space-y-4">
            {positions.map((position) => {
              const hasClaimable = position.resolved && 
                ((position.outcome && position.yesBalance > 0) || 
                 (!position.outcome && position.noBalance > 0));
              
              const claimableAmount = hasClaimable 
                ? (position.outcome ? position.yesBalance : position.noBalance)
                : 0;

              return (
                <div
                  key={position.address}
                  className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden hover:shadow-xl transition"
                >
                  <div className="p-6">
                    <div className="flex items-start gap-4 mb-4">
                      <div className="text-5xl bg-gradient-to-br from-purple-100 to-pink-100 p-3 rounded-xl">
                        {position.logo}
                      </div>
                      <div className="flex-1">
                        <div className="text-xs text-purple-600 font-semibold mb-1 uppercase tracking-wide">
                          {position.category}
                        </div>
                        <h3 className="font-bold text-xl mb-2">{position.question}</h3>
                        {position.description && (
                          <p className="text-gray-600 text-sm mb-2">{position.description}</p>
                        )}
                        <div className="flex items-center gap-4 text-sm">
                          <span className={`px-3 py-1 rounded-full font-medium ${
                            position.resolved 
                              ? 'bg-gray-100 text-gray-700'
                              : 'bg-green-100 text-green-700'
                          }`}>
                            {position.resolved ? 'Resolved' : 'Active'}
                          </span>
                          {hasClaimable && (
                            <span className="px-3 py-1 rounded-full font-medium bg-yellow-100 text-yellow-700 animate-pulse flex items-center gap-1">
                              <Sparkles className="w-4 h-4" />
                              Claimable!
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                      <div className="bg-green-50 rounded-xl p-4 border border-green-200">
                        <div className="text-xs text-green-700 font-semibold mb-1">YES Balance</div>
                        <div className="text-2xl font-bold text-green-600">
                          {position.yesBalance.toFixed(4)}
                        </div>
                        <div className="text-xs text-gray-600 mt-1">
                          ≈ ${(position.yesBalance * position.yesPrice).toFixed(2)}
                        </div>
                      </div>
                      <div className="bg-red-50 rounded-xl p-4 border border-red-200">
                        <div className="text-xs text-red-700 font-semibold mb-1">NO Balance</div>
                        <div className="text-2xl font-bold text-red-600">
                          {position.noBalance.toFixed(4)}
                        </div>
                        <div className="text-xs text-gray-600 mt-1">
                          ≈ ${(position.noBalance * position.noPrice).toFixed(2)}
                        </div>
                      </div>
                      <div className="bg-purple-50 rounded-xl p-4 border border-purple-200">
                        <div className="text-xs text-purple-700 font-semibold mb-1">LP Shares</div>
                        <div className="text-2xl font-bold text-purple-600">
                          {position.lpShares ? position.lpShares.toFixed(0) : '0'}
                        </div>
                        <div className="text-xs text-gray-600 mt-1">
                          ≈ ${((position.lpShares || 0) * 2).toFixed(2)}
                        </div>
                      </div>
                    </div>

                    {hasClaimable && (
                      <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mb-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="text-sm text-yellow-800 font-semibold mb-1">
                              🎉 You won this market!
                            </div>
                            <div className="text-2xl font-bold text-yellow-600">
                              ${claimableAmount.toFixed(2)} USDC
                            </div>
                          </div>
                          <Sparkles className="w-8 h-8 text-yellow-500" />
                        </div>
                      </div>
                    )}

                    <div className="flex gap-3">
                      <button
                        onClick={() => onViewMarket(position)}
                        className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 text-white py-3 rounded-xl font-semibold hover:shadow-lg transition flex items-center justify-center gap-2"
                      >
                        <ExternalLink className="w-4 h-4" />
                        View Market
                      </button>
                      {hasClaimable && (
                        <button
                          onClick={() => handleClaim(position.address)}
                          disabled={claiming[position.address]}
                          className="flex-1 bg-green-600 text-white py-3 rounded-xl font-semibold hover:shadow-lg transition flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {claiming[position.address] ? (
                            <>
                              <RefreshCw className="w-4 h-4 animate-spin" />
                              Claiming...
                            </>
                          ) : (
                            <>
                              <Sparkles className="w-4 h-4" />
                              Claim ${claimableAmount.toFixed(2)}
                            </>
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default UserProfile;