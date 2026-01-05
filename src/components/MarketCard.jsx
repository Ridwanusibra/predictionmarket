import React from 'react';
import { Clock, TrendingUp, ArrowRight } from 'lucide-react';

const MarketCard = ({ market, onClick }) => {
  const daysLeft = Math.ceil((market.endTime - Date.now()) / (1000 * 60 * 60 * 24));
  
  return (
    <div 
      onClick={onClick}
      className="bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 cursor-pointer border border-gray-100 overflow-hidden group hover:scale-[1.02]"
    >
      <div className="p-6">
        <div className="flex items-start gap-4 mb-4">
          <div className="text-5xl bg-gradient-to-br from-purple-100 to-pink-100 p-3 rounded-xl group-hover:scale-110 transition-transform">
            {market.logo}
          </div>
          <div className="flex-1">
            <div className="text-xs text-purple-600 font-semibold mb-1 uppercase tracking-wide">
              {market.category}
            </div>
            <h3 className="font-bold text-lg mb-2 line-clamp-2 group-hover:text-purple-600 transition">
              {market.question}
            </h3>
            <div className="flex items-center gap-4 text-sm text-gray-600">
              <span className="flex items-center gap-1">
                <Clock className="w-4 h-4" />
                {daysLeft}d left
              </span>
              <span className="flex items-center gap-1">
                <TrendingUp className="w-4 h-4" />
                ${(market.liquidity / 1000).toFixed(1)}k
              </span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-4 border border-green-200 group-hover:shadow-md transition">
            <div className="text-xs text-green-700 font-semibold mb-1">YES</div>
            <div className="text-3xl font-bold text-green-600">
              {(market.yesPrice * 100).toFixed(0)}¢
            </div>
          </div>
          <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-xl p-4 border border-red-200 group-hover:shadow-md transition">
            <div className="text-xs text-red-700 font-semibold mb-1">NO</div>
            <div className="text-3xl font-bold text-red-600">
              {(market.noPrice * 100).toFixed(0)}¢
            </div>
          </div>
        </div>

        <div className="flex justify-between items-center text-sm text-gray-600 pt-4 border-t">
          <span>Volume: ${(market.volume / 1000).toFixed(0)}k</span>
          <span className="flex items-center gap-1 text-purple-600 font-medium">
            Trade Now
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </span>
        </div>
      </div>
    </div>
  );
};

export default MarketCard;