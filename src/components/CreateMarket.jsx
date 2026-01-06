import React, { useState } from 'react';
import { useWallet } from '../context/WalletContext';
import { createMarket, getUSDCContract } from '../utils/contracts';
import { FACTORY_ADDRESS } from '../config/constants';
import { PlusCircle, Calendar, DollarSign, Clock, AlertCircle, CheckCircle, RefreshCw } from 'lucide-react';

const CreateMarket = ({ onMarketCreated }) => {
  const { signer, connected } = useWallet();
  
  // Form state
  const [question, setQuestion] = useState('');
  const [endDate, setEndDate] = useState('');
  const [endTime, setEndTime] = useState('12:00');
  const [resolutionDays, setResolutionDays] = useState('7');
  const [minBond, setMinBond] = useState('1');
  
  // UI state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [txHash, setTxHash] = useState('');

  // Validate form
  const validateForm = () => {
    if (!question.trim()) {
      setError('Please enter a market question');
      return false;
    }
    if (!endDate) {
      setError('Please select an end date');
      return false;
    }
    
    const selectedDateTime = new Date(`${endDate}T${endTime}`);
    const now = new Date();
    const oneHourFromNow = new Date(now.getTime() + 60 * 60 * 1000);
    
    if (selectedDateTime <= oneHourFromNow) {
      setError('End time must be at least 1 hour in the future');
      return false;
    }
    
    if (parseFloat(resolutionDays) < 1) {
      setError('Resolution window must be at least 1 day');
      return false;
    }
    
    if (parseFloat(minBond) < 0.1) {
      setError('Minimum bond must be at least $0.10');
      return false;
    }
    
    return true;
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!connected || !signer) {
      setError('Please connect your wallet first');
      return;
    }
    
    setError('');
    setSuccess('');
    setTxHash('');
    
    if (!validateForm()) {
      return;
    }
    
    setLoading(true);
    
    try {
      // Calculate timestamps
      const endDateTime = new Date(`${endDate}T${endTime}`);
      const endTimestamp = Math.floor(endDateTime.getTime() / 1000);
      const resolutionWindowSeconds = parseInt(resolutionDays) * 24 * 60 * 60;
      const minBondAmount = minBond;
      
      console.log('Creating market with params:', {
        question,
        endTimestamp,
        resolutionWindowSeconds,
        minBondAmount
      });
      
      // Check and approve creation fee if needed
      const usdc = getUSDCContract(signer);
      const factoryContract = await import('../utils/contracts').then(m => m.getFactoryContract(signer));
      const creationFee = await factoryContract.creationFee();
      
      if (creationFee.gt(0)) {
        console.log('Creation fee required:', creationFee.toString());
        
        const userAddress = await signer.getAddress();
        const allowance = await usdc.allowance(userAddress, FACTORY_ADDRESS);
        
        if (allowance.lt(creationFee)) {
          setSuccess('Step 1/2: Approving USDC...');
          const approveTx = await usdc.approve(FACTORY_ADDRESS, creationFee.mul(10)); // Approve for 10 markets
          await approveTx.wait();
          setSuccess('Step 1/2: USDC approved! ✅');
        }
      }
      
      // Create market
      setSuccess('Step 2/2: Creating market...');
      const { receipt, marketAddress } = await createMarket(
        question,
        endTimestamp,
        resolutionWindowSeconds,
        minBondAmount,
        signer
      );
      
      console.log('Market created!', { marketAddress, txHash: receipt.transactionHash });
      
      setTxHash(receipt.transactionHash);
      setSuccess(`✅ Market created successfully! Address: ${marketAddress}`);
      
      // Reset form
      setQuestion('');
      setEndDate('');
      setEndTime('12:00');
      setResolutionDays('7');
      setMinBond('1');
      
      // Notify parent to refresh markets
      if (onMarketCreated) {
        setTimeout(() => {
          onMarketCreated();
        }, 2000);
      }
      
    } catch (err) {
      console.error('Error creating market:', err);
      
      let errorMessage = 'Failed to create market';
      
      if (err.message.includes('user rejected')) {
        errorMessage = 'Transaction rejected by user';
      } else if (err.message.includes('insufficient funds')) {
        errorMessage = 'Insufficient funds for transaction';
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      setError(errorMessage);
    }
    
    setLoading(false);
  };

  // Preset templates
  const templates = [
    {
      question: 'Will Bitcoin reach $150,000 by end of 2026?',
      days: 365,
      bond: 100
    },
    {
      question: 'Will it rain tomorrow?',
      days: 1,
      bond: 1
    },
    {
      question: 'Will the S&P 500 close above 7000 this month?',
      days: 30,
      bond: 50
    }
  ];

  const applyTemplate = (template) => {
    setQuestion(template.question);
    setResolutionDays(template.days.toString());
    setMinBond(template.bond.toString());
    
    // Set end date to template days from now
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + template.days);
    setEndDate(futureDate.toISOString().split('T')[0]);
  };

  if (!connected) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-700 mb-2">Connect Your Wallet</h2>
          <p className="text-gray-600">Please connect your wallet to create markets</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 max-w-4xl">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-block bg-gradient-to-r from-purple-600 to-pink-600 p-4 rounded-2xl mb-4">
            <PlusCircle className="w-12 h-12 text-white" />
          </div>
          <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-purple-600 to-pink-600 text-transparent bg-clip-text">
            Create Prediction Market
          </h1>
          <p className="text-gray-600">
            Create a new binary prediction market for any yes/no question
          </p>
        </div>

        {/* Templates */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
          <h3 className="font-bold text-lg mb-4">Quick Templates</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {templates.map((template, idx) => (
              <button
                key={idx}
                onClick={() => applyTemplate(template)}
                className="text-left p-4 rounded-xl border-2 border-gray-200 hover:border-purple-600 hover:bg-purple-50 transition"
              >
                <div className="text-sm font-semibold text-purple-600 mb-2">Template {idx + 1}</div>
                <div className="text-sm text-gray-700 line-clamp-2">{template.question}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-lg p-8">
          {/* Question */}
          <div className="mb-6">
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Market Question *
            </label>
            <textarea
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="e.g., Will Bitcoin reach $150,000 by end of 2026?"
              rows={3}
              className="w-full p-4 border-2 border-gray-200 rounded-xl focus:border-purple-600 focus:outline-none resize-none"
              required
            />
            <p className="text-sm text-gray-500 mt-2">
              Ask a clear yes/no question with specific criteria
            </p>
          </div>

          {/* End Date & Time */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                End Date *
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                min={new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString().split('T')[0]}
                className="w-full p-4 border-2 border-gray-200 rounded-xl focus:border-purple-600 focus:outline-none"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                <Clock className="w-4 h-4" />
                End Time *
              </label>
              <input
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="w-full p-4 border-2 border-gray-200 rounded-xl focus:border-purple-600 focus:outline-none"
                required
              />
            </div>
          </div>

          {/* Resolution Window */}
          <div className="mb-6">
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Resolution Window (days) *
            </label>
            <input
              type="number"
              value={resolutionDays}
              onChange={(e) => setResolutionDays(e.target.value)}
              min="1"
              max="30"
              step="1"
              className="w-full p-4 border-2 border-gray-200 rounded-xl focus:border-purple-600 focus:outline-none"
              required
            />
            <p className="text-sm text-gray-500 mt-2">
              Time after market end during which outcome can be proposed (1-30 days)
            </p>
          </div>

          {/* Minimum Bond */}
          <div className="mb-6">
            <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
              <DollarSign className="w-4 h-4" />
              Minimum Bond (USDC) *
            </label>
            <input
              type="number"
              value={minBond}
              onChange={(e) => setMinBond(e.target.value)}
              min="0.1"
              step="0.1"
              className="w-full p-4 border-2 border-gray-200 rounded-xl focus:border-purple-600 focus:outline-none"
              required
            />
            <p className="text-sm text-gray-500 mt-2">
              Minimum USDC required to propose outcome (recommended: $1-$100)
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-6 bg-red-50 border-2 border-red-200 rounded-xl p-4 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <p className="text-red-800 text-sm">{error}</p>
            </div>
          )}

          {/* Success Message */}
          {success && (
            <div className="mb-6 bg-green-50 border-2 border-green-200 rounded-xl p-4 flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-green-800 text-sm">{success}</p>
                {txHash && (
                  <a
                    href={`https://sepolia.etherscan.io/tx/${txHash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-green-600 hover:text-green-700 text-xs underline mt-1 inline-block"
                  >
                    View on Etherscan →
                  </a>
                )}
              </div>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white py-4 rounded-xl font-bold text-lg hover:shadow-xl transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
          >
            {loading ? (
              <>
                <RefreshCw className="w-5 h-5 animate-spin" />
                {success.includes('Step') ? success : 'Creating Market...'}
              </>
            ) : (
              <>
                <PlusCircle className="w-5 h-5" />
                Create Market
              </>
            )}
          </button>

          <p className="text-center text-sm text-gray-500 mt-4">
            By creating a market, you agree that the question is clear and objectively verifiable
          </p>
        </form>
      </div>
    </div>
  );
};

export default CreateMarket;