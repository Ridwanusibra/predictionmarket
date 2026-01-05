import React, { useState, useEffect } from 'react';
import { Clock, TrendingUp, RefreshCw, Sparkles, Users } from 'lucide-react';

// ============= MARKET DETAIL =============
const MarketDetail = ({ market, onClose, onUpdate }) => {
  const [activeTab, setActiveTab] = useState('trade');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [lastUpdate, setLastUpdate] = useState(Date.now());
  
  // Trade state
  const [tradeAmount, setTradeAmount] = useState('');
  const [tradeSide, setTradeSide] = useState('yes');
  const [estimatedOutput, setEstimatedOutput] = useState('0');
  
  // Mint state
  const [mintAmount, setMintAmount] = useState('');
  
  // LP state
  const [lpYes, setLpYes] = useState('');
  const [lpNo, setLpNo] = useState('');

  // Auto-refresh every 5 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setLastUpdate(Date.now());
      onUpdate();
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  // Calculate swap output
  useEffect(() => {
    if (tradeAmount && parseFloat(tradeAmount) > 0) {
      const input = parseFloat(tradeAmount);
      const reserveIn = tradeSide === 'yes' ? market.liquidity * market.yesPrice : market.liquidity * market.noPrice;
      const reserveOut = tradeSide === 'yes' ? market.liquidity * market.noPrice : market.liquidity * market.yesPrice;
      const amountInWithFee = input * 0.997; // 0.3% fee
      const output = (amountInWithFee * reserveOut) / (reserveIn + amountInWithFee);
      setEstimatedOutput(output.toFixed(4));
    } else {
      setEstimatedOutput('0');
    }
  }, [tradeAmount, tradeSide, market]);

  const handleTrade = async () => {
    setLoading(true);
    setMessage('');
    try {
      await new Promise(resolve => setTimeout(resolve, 2000));
      setMessage(`✅ Successfully swapped ${tradeAmount} ${tradeSide.toUpperCase()} for ${estimatedOutput} ${tradeSide === 'yes' ? 'NO' : 'YES'}`);
      setTradeAmount('');
      onUpdate();
    } catch (err) {
      setMessage('❌ Transaction failed');
    }
    setLoading(false);
  };

  const handleMint = async () => {
    setLoading(true);
    setMessage('');
    try {
      await new Promise(resolve => setTimeout(resolve, 2000));
      setMessage(`✅ Minted ${mintAmount} YES + ${mintAmount} NO tokens`);
      setMintAmount('');
      onUpdate();
    } catch (err) {
      setMessage('❌ Transaction failed');
    }
    setLoading(false);
  };

  const handleAddLP = async () => {
    setLoading(true);
    setMessage('');
    try {
      await new Promise(resolve => setTimeout(resolve, 2000));
      const shares = Math.min(parseFloat(lpYes), parseFloat(lpNo));
      setMessage(`✅ Added liquidity! Received ${shares.toFixed(0)} LP shares`);
      setLpYes('');
      setLpNo('');
      onUpdate();
    } catch (err) {
      setMessage('❌ Transaction failed');
    }
    setLoading(false);
  };

  const handleRemoveLP = async () => {
    setLoading(true);
    setMessage('');
    try {
      await new Promise(resolve => setTimeout(resolve, 2000));
      setMessage(`✅ Removed all liquidity!`);
      onUpdate();
    } catch (err) {
      setMessage('❌ Transaction failed');
    }
    setLoading(false);
  };

  const daysLeft = Math.ceil((market.endTime - Date.now()) / (1000 * 60 * 60 * 24));

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
      <div className="bg-white rounded-3xl max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
        {/* Header */}
        <div className="p-6 border-b bg-gradient-to-r from-purple-50 to-pink-50">
          <div className="flex justify-between items-start mb-4">
            <div className="flex items-center gap-4">
              <div className="text-6xl bg-white p-4 rounded-2xl shadow-lg">
                {market.logo}
              </div>
              <div>
                <div className="text-xs text-purple-600 font-semibold mb-1 uppercase tracking-wide">
                  {market.category}
                </div>
                <h2 className="text-2xl font-bold mb-2">{market.question}</h2>
                <p className="text-sm text-gray-600 mb-3">{market.description}</p>
                <div className="flex gap-4 text-sm text-gray-600">
                  <span className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    {daysLeft} days left
                  </span>
                  <span className="flex items-center gap-1">
                    <TrendingUp className="w-4 h-4" />
                    ${(market.liquidity / 1000).toFixed(1)}k liquidity
                  </span>
                  <span className="flex items-center gap-1 text-green-600">
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    Live
                  </span>
                </div>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 text-3xl font-light hover:rotate-90 transition-transform"
            >
              ×
            </button>
          </div>
        </div>

        {/* Price Display */}
        <div className="p-6 bg-gray-50">
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-gradient-to-br from-green-100 to-green-50 rounded-2xl p-6 border-2 border-green-200 shadow-md">
              <div className="text-sm text-green-700 font-semibold mb-2">YES Price</div>
              <div className="text-4xl font-bold text-green-600 mb-2">
                {(market.yesPrice * 100).toFixed(1)}¢
              </div>
              <div className="text-sm text-gray-600">Balance: {market.yesBalance.toFixed(2)}</div>
            </div>
            <div className="bg-gradient-to-br from-red-100 to-red-50 rounded-2xl p-6 border-2 border-red-200 shadow-md">
              <div className="text-sm text-red-700 font-semibold mb-2">NO Price</div>
              <div className="text-4xl font-bold text-red-600 mb-2">
                {(market.noPrice * 100).toFixed(1)}¢
              </div>
              <div className="text-sm text-gray-600">Balance: {market.noBalance.toFixed(2)}</div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b px-6">
          <div className="flex gap-1">
            {['trade', 'mint', 'liquidity'].map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-6 py-3 font-semibold transition relative ${
                  activeTab === tab
                    ? 'text-purple-600'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
                {activeTab === tab && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-purple-600" />
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Trade Tab */}
          {activeTab === 'trade' && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => setTradeSide('yes')}
                  className={`py-3 rounded-xl font-semibold transition ${
                    tradeSide === 'yes'
                      ? 'bg-green-600 text-white shadow-lg scale-105'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Buy YES
                </button>
                <button
                  onClick={() => setTradeSide('no')}
                  className={`py-3 rounded-xl font-semibold transition ${
                    tradeSide === 'no'
                      ? 'bg-red-600 text-white shadow-lg scale-105'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Buy NO
                </button>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Amount to Swap</label>
                <input
                  type="number"
                  value={tradeAmount}
                  onChange={(e) => setTradeAmount(e.target.value)}
                  placeholder="0.00"
                  className="w-full p-4 border-2 rounded-xl focus:border-purple-600 focus:outline-none text-lg"
                />
              </div>

              {estimatedOutput !== '0' && (
                <div className="bg-purple-50 p-4 rounded-xl border border-purple-200">
                  <div className="text-sm text-gray-600 mb-1">You will receive</div>
                  <div className="text-2xl font-bold text-purple-600">
                    {estimatedOutput} {tradeSide === 'yes' ? 'NO' : 'YES'}
                  </div>
                </div>
              )}
              
              <button
                onClick={handleTrade}
                disabled={loading || !tradeAmount}
                className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white py-4 rounded-xl font-bold text-lg hover:shadow-lg transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <RefreshCw className="w-5 h-5 animate-spin" />
                    Processing...
                  </>
                ) : (
                  `Swap ${tradeSide.toUpperCase()} tokens`
                )}
              </button>
            </div>
          )}

          {/* Mint Tab */}
          {activeTab === 'mint' && (
            <div className="space-y-4">
              <div className="bg-blue-50 p-5 rounded-xl border border-blue-200">
                <div className="flex items-start gap-3">
                  <Sparkles className="w-6 h-6 text-blue-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <div className="font-semibold text-blue-900 mb-1">How Minting Works</div>
                    <p className="text-sm text-blue-800">
                      Deposit USDC to mint equal amounts of YES and NO tokens. 
                      1 USDC = 1 YES + 1 NO token. You can then trade or provide liquidity with these tokens.
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">USDC Amount</label>
                <input
                  type="number"
                  value={mintAmount}
                  onChange={(e) => setMintAmount(e.target.value)}
                  placeholder="0.00"
                  className="w-full p-4 border-2 rounded-xl focus:border-purple-600 focus:outline-none text-lg"
                />
              </div>
              
              {mintAmount && (
                <div className="bg-green-50 p-4 rounded-xl border border-green-200">
                  <div className="text-sm text-gray-600 mb-1">You will receive</div>
                  <div className="text-xl font-bold text-green-600">
                    {mintAmount} YES + {mintAmount} NO
                  </div>
                </div>
              )}

              <button
                onClick={handleMint}
                disabled={loading || !mintAmount}
                className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white py-4 rounded-xl font-bold text-lg hover:shadow-lg transition disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <RefreshCw className="w-5 h-5 animate-spin" />
                    Processing...
                  </>
                ) : (
                  'Mint Tokens'
                )}
              </button>
            </div>
          )}

          {/* Liquidity Tab */}
          {activeTab === 'liquidity' && (
            <div className="space-y-4">
              <div className="bg-purple-50 p-5 rounded-xl border border-purple-200">
                <div className="flex justify-between items-center">
                  <div>
                    <div className="text-sm text-gray-600 mb-1">Your LP Shares</div>
                    <div className="text-2xl font-bold text-purple-600">{market.lpShares.toFixed(0)}</div>
                  </div>
                  <Users className="w-10 h-10 text-purple-400" />
                </div>
              </div>
              
              <div className="space-y-3">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">YES Amount</label>
                  <input
                    type="number"
                    value={lpYes}
                    onChange={(e) => setLpYes(e.target.value)}
                    placeholder="0.00"
                    className="w-full p-4 border-2 rounded-xl focus:border-purple-600 focus:outline-none text-lg"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">NO Amount</label>
                  <input
                    type="number"
                    value={lpNo}
                    onChange={(e) => setLpNo(e.target.value)}
                    placeholder="0.00"
                    className="w-full p-4 border-2 rounded-xl focus:border-purple-600 focus:outline-none text-lg"
                  />
                </div>
              </div>
              
              <div className="flex gap-3 mt-4">
                <button
                  onClick={handleAddLP}
                  disabled={loading || !lpYes || !lpNo}
                  className="flex-1 bg-green-600 text-white py-3 rounded-xl font-bold hover:shadow-lg transition disabled:opacity-50"
                >
                  {loading ? 'Processing...' : 'Add Liquidity'}
                </button>
                <button
                  onClick={handleRemoveLP}
                  disabled={loading}
                  className="flex-1 bg-red-600 text-white py-3 rounded-xl font-bold hover:shadow-lg transition disabled:opacity-50"
                >
                  {loading ? 'Processing...' : 'Remove Liquidity'}
                </button>
              </div>

              {message && (
                <div className="mt-4 p-4 bg-gray-100 rounded-xl text-gray-800">
                  {message}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MarketDetail;