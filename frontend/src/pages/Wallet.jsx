import React, { useState, useEffect } from 'react';
import axios from '../utils/axios';
import { loadStripe } from '@stripe/stripe-js';
import { useNavigate } from 'react-router-dom';

const Wallet = () => {
  const navigate = useNavigate();
  const [wallet, setWallet] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedPack, setSelectedPack] = useState(null);
  const [activeTab, setActiveTab] = useState('overview'); // 'overview', 'transactions', 'coupons'

  // Define coin packs
  const coinPacks = [
    { id: 'starter', name: 'Starter', coins: 100, price: 99, desc: 'Perfect for beginners' },
    { id: 'pro', name: 'Pro', coins: 300, price: 249, desc: 'Best value pack', featured: true },
    { id: 'elite', name: 'Elite', coins: 700, price: 499, desc: 'Most popular' }
  ];

  useEffect(() => {
    fetchWalletData();
  }, []);

  const handleTabChange = (tab) => {
    setActiveTab(tab);
  };

  const fetchWalletData = async () => {
    try {
      setLoading(true);
      
      // Get wallet data
      const walletRes = await axios.get('/api/wallet/me');
      setWallet(walletRes.data);
      
      // Get analytics
      const analyticsRes = await axios.get('/api/wallet/analytics');
      setAnalytics(analyticsRes.data);
    } catch (err) {
      console.error('Error fetching wallet data:', err);
      setError(err.response?.data?.message || 'Failed to load wallet data');
    } finally {
      setLoading(false);
    }
  };

  const handleBuyCoins = async (packId) => {
    try {
      // Create payment intent
      const response = await axios.post('/api/wallet/create-coin-payment-intent', {
        packId
      });

      // Initialize Stripe
      const stripe = await loadStripe(process.env.REACT_APP_STRIPE_PUBLISHABLE_KEY);
      
      // Confirm payment
      const result = await stripe.confirmCardPayment(response.data.clientSecret);
      
      if (result.error) {
        alert(result.error.message);
      } else {
        // Payment succeeded - add coins to wallet
        const pack = coinPacks.find(p => p.id === packId);
        await axios.post('/api/wallet/add-coins', {
          coinsToAdd: pack.coins,
          packId
        });
        
        // Refresh wallet data
        fetchWalletData();
        alert('Coins purchased successfully!');
      }
    } catch (err) {
      console.error('Error purchasing coins:', err);
      alert(err.response?.data?.message || 'Failed to purchase coins');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 text-gray-900 py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
            <p className="mt-4 text-lg">Loading wallet...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 text-gray-900 py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
            <strong className="font-bold">Error! </strong>
            <span className="block sm:inline">{error}</span>
            <button 
              onClick={fetchWalletData}
              className="mt-3 bg-red-600 hover:bg-red-700 text-white py-2 px-4 rounded"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold text-center mb-8">My Wallet</h1>
        
        {/* Tabs Navigation */}
        <div className="flex border-b border-gray-200 mb-6">
          <button
            className={`py-3 px-6 font-medium text-sm rounded-t-lg ${
              activeTab === 'overview'
                ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                : 'text-gray-500 hover:text-gray-700'
            }`}
            onClick={() => handleTabChange('overview')}
          >
            Overview
          </button>
          <button
            className={`py-3 px-6 font-medium text-sm rounded-t-lg ${
              activeTab === 'transactions'
                ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                : 'text-gray-500 hover:text-gray-700'
            }`}
            onClick={() => handleTabChange('transactions')}
          >
            Transactions
          </button>
          <button
            className={`py-3 px-6 font-medium text-sm rounded-t-lg ${
              activeTab === 'coupons'
                ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                : 'text-gray-500 hover:text-gray-700'
            }`}
            onClick={() => handleTabChange('coupons')}
          >
            Coupons
          </button>
        </div>
        
        {/* Balance Overview */}
        <div className="rounded-xl shadow-lg p-6 mb-8 bg-gradient-to-r from-blue-500 to-purple-600 text-white">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
            <div>
              <h2 className="text-lg font-medium opacity-80">Current Balance</h2>
              <p className="text-4xl font-bold mt-2">{wallet?.balance || 0} Coins</p>
              <p className="opacity-80 mt-1">Level: {wallet?.level || 'Beginner'}</p>
            </div>
            <button 
              onClick={() => document.getElementById('buy-coins-modal').classList.remove('hidden')}
              className="mt-4 md:mt-0 bg-white text-blue-600 hover:bg-gray-100 font-bold py-3 px-6 rounded-lg transition duration-300"
            >
              Buy More Coins
            </button>
          </div>
        </div>

        {/* Tab Specific Content */}
        {activeTab === 'overview' && (
          <>
            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="p-6 rounded-lg shadow bg-white">
                <h3 className="font-bold text-gray-700 mb-2">Total Earned</h3>
                <p className="text-3xl font-bold text-gray-900">{analytics?.totalCoinsEarned || 0}</p>
              </div>
              <div className="p-6 rounded-lg shadow bg-white">
                <h3 className="font-bold text-gray-700 mb-2">Total Spent</h3>
                <p className="text-3xl font-bold text-gray-900">{analytics?.totalSpent || 0}</p>
              </div>
              <div className="p-6 rounded-lg shadow bg-white">
                <h3 className="font-bold text-gray-700 mb-2">Cashback Earned</h3>
                <p className="text-3xl font-bold text-gray-900">{analytics?.totalCashback || 0}</p>
              </div>
            </div>

            {/* Level Progress */}
            {analytics?.levelProgress && (
              <div className="p-6 rounded-lg shadow mb-8 bg-white">
                <h3 className="text-xl font-semibold mb-4">Level Progress</h3>
                <div className="flex items-center justify-between mb-2">
                  <span>Current: {analytics.levelProgress.currentLevel}</span>
                  {analytics.levelProgress.nextLevel && (
                    <span>Next: {analytics.levelProgress.nextLevel}</span>
                  )}
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2.5">
                  <div 
                    className="bg-blue-600 h-2.5 rounded-full" 
                    style={{ width: `${analytics.levelProgress.progress.percent}%` }}
                  ></div>
                </div>
                {analytics.levelProgress.nextLevel && (
                  <p className="mt-2 text-sm text-gray-500">
                    {analytics.levelProgress.progress.remaining} coins to next level
                  </p>
                )}
              </div>
            )}

            {/* Coin Packs */}
            <div className="mb-8">
              <h2 className="text-2xl font-bold mb-6">Buy Coins</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {coinPacks.map(pack => (
                  <div 
                    key={pack.id}
                    className={`rounded-xl shadow-lg p-6 border-2 ${
                      pack.featured 
                        ? 'border-purple-600' 
                        : 'border-gray-300'
                    } bg-white`}
                  >
                    {pack.featured && (
                      <div className="bg-purple-500 text-white text-xs font-bold px-3 py-1 rounded-full inline-block mb-4">
                        MOST POPULAR
                      </div>
                    )}
                    <h3 className="text-xl font-bold mb-2">{pack.name}</h3>
                    <p className="text-gray-500 mb-4">{pack.desc}</p>
                    <div className="text-3xl font-bold mb-4">{pack.coins} <span className="text-lg">coins</span></div>
                    <div className="text-2xl font-bold mb-6">₹{pack.price}</div>
                    <button 
                      onClick={() => handleBuyCoins(pack.id)}
                      className={`w-full py-3 rounded-lg font-bold ${
                        pack.featured 
                          ? 'bg-purple-600 hover:bg-purple-700 text-white' 
                          : 'bg-gray-200 hover:bg-gray-300 text-gray-800'
                      }`}
                    >
                      Purchase
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {activeTab === 'transactions' && (
          <div className="rounded-lg shadow bg-white p-6 mb-8">
            <h3 className="text-xl font-semibold mb-4">Transaction History</h3>
            {analytics?.recentTransactions && analytics.recentTransactions.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {analytics.recentTransactions.map((tx, index) => (
                      <tr key={index}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            tx.type === 'credit' || tx.type === 'cashback' || tx.type === 'purchase' || tx.type === 'coupon_used'
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {tx.type}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={
                            tx.type === 'credit' || tx.type === 'cashback' || tx.type === 'purchase' || tx.type === 'coupon_used'
                              ? 'text-green-600' 
                              : 'text-red-600'
                          }>
                            {tx.type === 'credit' || tx.type === 'cashback' || tx.type === 'purchase' || tx.type === 'coupon_used' ? '+' : '-'}{tx.amount}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {tx.description}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(tx.createdAt).toLocaleDateString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-gray-500">No transactions yet</p>
            )}
          </div>
        )}

        {activeTab === 'coupons' && (
          <div className="mb-8">
            <h2 className="text-2xl font-bold mb-4">Your Coupons</h2>
            {wallet?.coupons && wallet.coupons.filter(coupon => !coupon.used && new Date(coupon.expirationDate) > new Date()).length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {wallet.coupons
                  .filter(coupon => !coupon.used && new Date(coupon.expirationDate) > new Date())
                  .map((coupon, index) => (
                    <div 
                      key={index} 
                      className="p-6 rounded-xl border border-gray-200 bg-white shadow-sm flex flex-col justify-between"
                    >
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <h3 className="font-bold text-xl text-gray-900 bg-gray-100 px-3 py-1 rounded border border-dashed border-gray-400 inline-block mb-2">{coupon.code}</h3>
                          <p className="text-blue-600 font-bold text-lg">{coupon.discountPercent}% OFF</p>
                        </div>
                        <span className="text-xs font-semibold bg-green-100 text-green-800 px-2.5 py-1 rounded-full">
                          Active
                        </span>
                      </div>
                      <p className="text-sm text-gray-500">
                        Expires: {new Date(coupon.expirationDate).toLocaleDateString()}
                      </p>
                    </div>
                  ))
                }
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow p-6 text-center text-gray-500">
                No active coupons available at this time.
              </div>
            )}
          </div>
        )}
      </div>

      {/* Buy Coins Modal */}
      <div id="buy-coins-modal" className="hidden fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="rounded-lg shadow-xl w-full max-w-md p-6 bg-white">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-bold">Buy Coins</h3>
            <button 
              onClick={() => document.getElementById('buy-coins-modal').classList.add('hidden')}
              className="text-gray-500 hover:text-gray-700"
            >
              ✕
            </button>
          </div>
          
          <p className="mb-6">Select a coin pack to purchase:</p>
          
          <div className="space-y-4">
            {coinPacks.map(pack => (
              <div 
                key={pack.id}
                className={`p-4 rounded-lg border cursor-pointer ${
                  selectedPack === pack.id 
                    ? 'border-blue-500 bg-blue-50' 
                    : 'border-gray-300'
                }`}
                onClick={() => setSelectedPack(pack.id)}
              >
                <div className="flex justify-between items-center">
                  <div>
                    <h4 className="font-bold">{pack.name}</h4>
                    <p className="text-sm text-gray-500">{pack.desc}</p>
                  </div>
                  <div className="text-right">
                    <div className="font-bold">{pack.coins} coins</div>
                    <div className="text-lg">₹{pack.price}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          <div className="mt-6 flex space-x-3">
            <button 
              onClick={() => document.getElementById('buy-coins-modal').classList.add('hidden')}
              className="flex-1 py-2 px-4 rounded bg-gray-200 hover:bg-gray-300 text-gray-800"
            >
              Cancel
            </button>
            <button 
              onClick={() => {
                if (selectedPack) {
                  handleBuyCoins(selectedPack);
                  document.getElementById('buy-coins-modal').classList.add('hidden');
                }
              }}
              disabled={!selectedPack}
              className={`flex-1 py-2 px-4 rounded text-white ${
                selectedPack 
                  ? 'bg-blue-600 hover:bg-blue-700' 
                  : 'bg-blue-400 cursor-not-allowed'
              }`}
            >
              Proceed to Pay
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Wallet;