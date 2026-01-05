import React, { useState, useEffect } from 'react';
import { RefreshCw, Activity } from 'lucide-react';
import MarketCard from './MarketCard'; // Make sure this path matches your structure

const MarketsDashboard = ({ markets, onSelectMarket }) => {
  const [filter, setFilter] = useState('all');
  const [lastUpdate, setLastUpdate] = useState(Date.now());

  // Auto-refresh every 5 seconds
  useEffect(() => {
    const interval = setInterval(() => setLastUpdate(Date.now()), 5000);
    return () => clearInterval(interval);
  }, []);

  const filteredMarkets = filter === 'all'
    ? markets
    : markets.filter(m => m.category.toLowerCase() === filter);

  const categories = ['all', 'crypto', 'politics', 'sports'];

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-purple-600 to-pink-600 text-transparent bg-clip-text">
                Live Markets
              </h1>
              <p className="text-gray-600">Trade on the most popular prediction markets</p>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <RefreshCw className="w-4 h-4 animate-spin text-green-600" />
              Live updates
            </div>
          </div>

          {/* Category Filter */}
          <div className="flex gap-2 overflow-x-auto pb-2">
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setFilter(cat)}
                className={`px-6 py-2 rounded-xl font-medium transition whitespace-nowrap ${
                  filter === cat
                    ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg'
                    : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
                }`}
              >
                {cat.charAt(0).toUpperCase() + cat.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Market Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredMarkets.map(market => (
            <MarketCard
              key={market.id}
              market={market}
              onClick={() => onSelectMarket(market)}
            />
          ))}
        </div>

        {filteredMarkets.length === 0 && (
          <div className="bg-white rounded-2xl p-12 text-center shadow-lg">
            <Activity className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-gray-700 mb-2">No Markets Found</h3>
            <p className="text-gray-600">Try selecting a different category</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default MarketsDashboard;