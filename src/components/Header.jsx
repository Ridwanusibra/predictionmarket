import React from 'react';
import { useWallet } from '../context/WalletContext';
import { Activity, Wallet } from 'lucide-react';

const Header = ({ onNavigate, currentPage }) => {
  const { connected, address, disconnectWallet } = useWallet();

  return (
    <header className="bg-white shadow-lg sticky top-0 z-50">
      <div className="container mx-auto px-4 py-4 flex justify-between items-center">
        <div 
          className="flex items-center gap-3 cursor-pointer hover:opacity-80 transition"
          onClick={() => onNavigate('markets')}
        >
          <Activity className="w-8 h-8 text-purple-600" />
          <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 text-transparent bg-clip-text">
            PredictHub
          </h1>
        </div>
        
        <nav className="flex items-center gap-6">
          <button
            onClick={() => onNavigate('markets')}
            className={`font-medium transition ${
              currentPage === 'markets'
                ? 'text-purple-600 border-b-2 border-purple-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Markets
          </button>
          <button
            onClick={() => onNavigate('profile')}
            className={`font-medium transition ${
              currentPage === 'profile'
                ? 'text-purple-600 border-b-2 border-purple-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Portfolio
          </button>
          
          {connected && (
            <button
              onClick={disconnectWallet}
              className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-4 py-2 rounded-lg font-semibold hover:shadow-lg transition flex items-center gap-2"
            >
              <Wallet className="w-4 h-4" />
              {address.slice(0, 6)}...{address.slice(-4)}
            </button>
          )}
        </nav>
      </div>
    </header>
  );
};

export default Header;