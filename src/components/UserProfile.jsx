import React, { useState, useEffect } from 'react';
import { Wallet, Activity, RefreshCw, ExternalLink, Sparkles, Users } from 'lucide-react';
import { useWallet } from '../context/WalletContext';

const UserProfile = ({ markets, onViewMarket, onUpdate }) => {
  const { address, disconnectWallet } = useWallet();
  const [lastUpdate, setLastUpdate] = useState(Date.now());

  // Auto-refresh every 5 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setLastUpdate(Date.now());
      onUpdate();
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const userMarkets = markets.filter(m => m.yesBalance > 0 || m.noBalance > 0 || m.lpShares > 0);

  const totalValue = userMarkets.reduce((sum, m) => {
    const yesValue = m.yesBalance * m.yesPrice;
    const noValue = m.noBalance * m.noPrice;
    return sum + yesValue + noValue;
  }, 0);

  const totalLPValue = userMarkets.reduce((sum, m) => sum + (m.lpShares * 2), 0); // Simplified LP value

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 max-w-6xl">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 to-pink-600 rounded-3xl p-8 text-white mb-8 shadow-xl">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h1 className="text-4xl font-bold mb-2">Your Portfolio</h1>
              <p className="text-white/80">{address.slice(0, 8)}...{address.slice(-6)}</p>
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
              <div className="text-white/80 text-sm mb-2">Active Markets</div>
              <div className="text-3xl font-bold">{userMarkets.length}</div>
            </div>
          </div>
        </div>

        {/* Auto-refresh indicator */}
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">Your Positions</h2>
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <RefreshCw className="w-4 h-4 animate-spin text-green-600" />
            Live updates every 5s
          </div>
        </div>

        {userMarkets.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 text-center shadow-lg">
            <Activity className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-gray-700 mb-2">No Positions Yet</h3>
            <p className="text-gray-600 mb-6">Start trading on prediction markets to see your positions here</p>
          </div>
        ) : (
          <div className="space-y-4">
            {userMarkets.map((market) => {
              const hasClaimable = market.resolved &&
                ((market.outcome && market.yesBalance > 0) || (!market.outcome && market.noBalance > 0));
              return (
                <div key={market.id} className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden hover:shadow-xl transition">
                  <div className="p-6">
                    <div className="flex items-start gap-4 mb-4">
                      <div className="text-5xl bg-gradient-to-br from-purple-100 to-pink-100 p-3 rounded-xl">{market.logo}</div>
                      <div className="flex-1">
                        <div className="text-xs text-purple-600 font-semibold mb-1 uppercase tracking-wide">{market.category}</div>
                        <h3 className="font-bold text-xl mb-2">{market.question}</h3>
                        <div className="flex items-center gap-4 text-sm">
                          <span className={`px-3 py-1 rounded-full font-medium ${
                            market.resolved ? 'bg-gray-100 text-gray-700' : 'bg-green-100 text-green-700'}`}>
                            {market.resolved ? 'Resolved' : 'Active'}
                          </span>
                          {hasClaimable && (
                            <span className="px-3 py-1 rounded-full font-medium bg-yellow-100 text-yellow-700 animate-pulse">
                              🎉 Claimable
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                      <div className="bg-green-50 rounded-xl p-4 border border-green-200">
                        <div className="text-xs text-green-700 font-semibold mb-1">YES Balance</div>
                        <div className="text-2xl font-bold text-green-600">{market.yesBalance.toFixed(2)}</div>
                        <div className="text-xs text-gray-600 mt-1">≈ ${(market.yesBalance * market.yesPrice).toFixed(2)}</div>
                      </div>
                      <div className="bg-red-50 rounded-xl p-4 border border-red-200">
                        <div className="text-xs text-red-700 font-semibold mb-1">NO Balance</div>
                        <div className="text-2xl font-bold text-red-600">{market.noBalance.toFixed(2)}</div>
                        <div className="text-xs text-gray-600 mt-1">≈ ${(market.noBalance * market.noPrice).toFixed(2)}</div>
                      </div>
                      <div className="bg-purple-50 rounded-xl p-4 border border-purple-200">
                        <div className="text-xs text-purple-700 font-semibold mb-1">LP Shares</div>
                        <div className="text-2xl font-bold text-purple-600">{market.lpShares.toFixed(0)}</div>
                        <div className="text-xs text-gray-600 mt-1">≈ ${(market.lpShares * 2).toFixed(2)}</div>
                      </div>
                    </div>

                    <div className="flex gap-3">
                      <button onClick={() => onViewMarket(market)} className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 text-white py-3 rounded-xl font-semibold hover:shadow-lg transition flex items-center justify-center gap-2">
                        <ExternalLink className="w-4 h-4" /> View Market
                      </button>
                      {hasClaimable && (
                        <button className="flex-1 bg-green-600 text-white py-3 rounded-xl font-semibold hover:shadow-lg transition flex items-center justify-center gap-2">
                          <Sparkles className="w-4 h-4" /> Claim Winnings
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