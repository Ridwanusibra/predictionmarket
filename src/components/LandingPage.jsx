import React, { useState } from 'react';
import { Activity, Wallet, ArrowRight, Sparkles, TrendingUp, Users } from 'lucide-react';

const LandingPage = ({ onConnect }) => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-600 via-pink-500 to-orange-400 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-white/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-white/10 rounded-full blur-3xl animate-pulse delay-1000" />
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-white/5 rounded-full blur-2xl animate-ping" />
      </div>

      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen px-4 text-white text-center">
        {/* Logo/Icon */}
        <div className="mb-8 animate-bounce">
          <div className="bg-white/20 backdrop-blur-lg p-6 rounded-3xl shadow-2xl border border-white/30">
            <Activity className="w-20 h-20 text-white" />
          </div>
        </div>

        {/* Main Heading */}
        <h1 className="text-6xl md:text-7xl font-black mb-4 animate-fade-in">
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-white via-yellow-200 to-white">
            PredictHub
          </span>
        </h1>

        <p className="text-xl md:text-2xl mb-6 text-white/90 max-w-2xl font-light">
          Trade on Real-World Events. Earn from Your Predictions.
        </p>

        <p className="text-lg mb-12 text-white/80 max-w-xl">
          Fully decentralized prediction markets powered by smart contracts on Arc Network
        </p>

        {/* Connect Wallet Button */}
        <button
          onClick={onConnect}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          className="group relative bg-white text-purple-600 px-10 py-5 rounded-2xl font-bold text-lg shadow-2xl hover:shadow-white/50 transition-all duration-300 hover:scale-105 flex items-center gap-3"
        >
          <Wallet className="w-6 h-6" />
          Connect Wallet
          <ArrowRight className={`w-5 h-5 transition-transform duration-300 ${isHovered ? 'translate-x-1' : ''}`} />
          
          {/* Sparkle effect */}
          <Sparkles className="absolute -top-2 -right-2 w-6 h-6 text-yellow-400 animate-pulse" />
        </button>

        {/* Stats Section */}
        <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl w-full">
          {[
            { icon: TrendingUp, label: 'Total Volume', value: '$2.5M+' },
            { icon: Users, label: 'Active Traders', value: '1,200+' },
            { icon: Activity, label: 'Live Markets', value: '156' }
          ].map((stat, idx) => (
            <div
              key={idx}
              className="bg-white/10 backdrop-blur-lg p-6 rounded-2xl border border-white/20 hover:bg-white/20 transition-all duration-300 hover:scale-105"
            >
              <stat.icon className="w-10 h-10 mx-auto mb-3 text-white" />
              <div className="text-3xl font-bold mb-1">{stat.value}</div>
              <div className="text-sm text-white/80">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default LandingPage;