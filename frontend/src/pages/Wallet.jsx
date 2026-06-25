import React, { useState, useEffect } from 'react';
import axios from '../utils/axios';
import { loadStripe } from '@stripe/stripe-js';
import { useNavigate } from 'react-router-dom';
import './Wallet.css';

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
      <div className="wallet-container">
        <div style={{ textAlign: 'center', padding: '40px 0' }}>
          <div style={{ width: '40px', height: '40px', border: '3px solid var(--border-color)', borderTopColor: 'var(--primary-color)', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto' }}></div>
          <p style={{ marginTop: '16px', color: 'var(--text-muted)' }}>Loading wallet...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="wallet-container">
        <div className="checkout-error" style={{ margin: '20px 0', textAlign: 'center' }}>
          <strong>Error! </strong>
          <span>{error}</span>
          <button 
            onClick={fetchWalletData}
            className="btn-primary"
            style={{ marginTop: '16px', display: 'block', margin: '16px auto 0' }}
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="wallet-container">
      <div className="wallet-header">
        <h1 className="wallet-title">My Wallet</h1>
        <p className="wallet-subtitle">Manage your coins, coupons, and view transaction history</p>
      </div>
      
      {/* Tabs Navigation */}
      <div className="flex border-b mb-6" style={{ display: 'flex', gap: '8px', borderBottom: '1px solid var(--border-color)', marginBottom: '24px' }}>
        <button
          className="nav-link"
          style={{
            border: 'none',
            background: activeTab === 'overview' ? 'var(--primary-color)' : 'transparent',
            color: activeTab === 'overview' ? 'white' : 'var(--text-muted)',
            cursor: 'pointer',
            padding: '8px 16px',
            borderRadius: 'var(--radius-sm)',
            fontWeight: '600'
          }}
          onClick={() => handleTabChange('overview')}
        >
          Overview
        </button>
        <button
          className="nav-link"
          style={{
            border: 'none',
            background: activeTab === 'transactions' ? 'var(--primary-color)' : 'transparent',
            color: activeTab === 'transactions' ? 'white' : 'var(--text-muted)',
            cursor: 'pointer',
            padding: '8px 16px',
            borderRadius: 'var(--radius-sm)',
            fontWeight: '600'
          }}
          onClick={() => handleTabChange('transactions')}
        >
          Transactions
        </button>
        <button
          className="nav-link"
          style={{
            border: 'none',
            background: activeTab === 'coupons' ? 'var(--primary-color)' : 'transparent',
            color: activeTab === 'coupons' ? 'white' : 'var(--text-muted)',
            cursor: 'pointer',
            padding: '8px 16px',
            borderRadius: 'var(--radius-sm)',
            fontWeight: '600'
          }}
          onClick={() => handleTabChange('coupons')}
        >
          Coupons
        </button>
      </div>
      
      {/* Balance Overview */}
      <div className="wallet-balance-section">
        <div>
          <h2 className="wallet-balance-title">Current Balance</h2>
          <p className="wallet-balance-amount">{wallet?.balance || 0}<span className="wallet-balance-currency">Coins</span></p>
          <p className="opacity-90 mt-1">Tier Level: {wallet?.level || 'Beginner'}</p>
        </div>
        <button 
          onClick={() => document.getElementById('buy-coins-modal').classList.remove('hidden')}
          className="wallet-action-button wallet-action-button-add"
        >
          Buy More Coins
        </button>
      </div>

      {/* Tab Specific Content */}
      {activeTab === 'overview' && (
        <div className="wallet-content">
          <div className="wallet-main-section">
            <h2 className="wallet-section-title">Quick Stats</h2>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px', marginBottom: '24px' }}>
              <div className="wallet-coupon-card" style={{ padding: '16px' }}>
                <h3 style={{ fontSize: '13px', fontWeight: '750', color: 'var(--text-muted)' }}>Total Earned</h3>
                <p style={{ fontSize: '24px', fontWeight: '800', marginTop: '8px', color: 'var(--accent-color)' }}>{analytics?.totalCoinsEarned || 0} coins</p>
              </div>
              <div className="wallet-coupon-card" style={{ padding: '16px' }}>
                <h3 style={{ fontSize: '13px', fontWeight: '750', color: 'var(--text-muted)' }}>Total Spent</h3>
                <p style={{ fontSize: '24px', fontWeight: '800', marginTop: '8px', color: '#ef4444' }}>{analytics?.totalSpent || 0} coins</p>
              </div>
              <div className="wallet-coupon-card" style={{ padding: '16px' }}>
                <h3 style={{ fontSize: '13px', fontWeight: '750', color: 'var(--text-muted)' }}>Cashback Earned</h3>
                <p style={{ fontSize: '24px', fontWeight: '800', marginTop: '8px', color: 'var(--primary-color)' }}>{analytics?.totalCashback || 0} coins</p>
              </div>
            </div>

            {/* Level Progress */}
            {analytics?.levelProgress && (
              <div className="wallet-coupon-card" style={{ padding: '24px' }}>
                <h3 style={{ fontSize: '15px', fontWeight: '750', color: 'var(--text-main)', marginBottom: '12px' }}>Level Progress</h3>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', fontWeight: '600', marginBottom: '8px' }}>
                  <span>Current: <strong>{analytics.levelProgress.currentLevel}</strong></span>
                  {analytics.levelProgress.nextLevel && (
                    <span>Next: <strong>{analytics.levelProgress.nextLevel}</strong></span>
                  )}
                </div>
                <div style={{ width: '100%', height: '8px', backgroundColor: '#f1f5f9', borderRadius: '4px', overflow: 'hidden' }}>
                  <div 
                    style={{ height: '100%', backgroundColor: 'var(--primary-color)', width: `${analytics.levelProgress.progress.percent}%`, borderRadius: '4px' }}
                  ></div>
                </div>
                {analytics.levelProgress.nextLevel && (
                  <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '8px' }}>
                    {analytics.levelProgress.progress.remaining} coins remaining to reach next level
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Quick Packs Sidebar */}
          <div className="wallet-transactions-section">
            <h2 className="wallet-section-title">Coin Packs</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {coinPacks.map(pack => (
                <div 
                  key={pack.id}
                  className="wallet-coupon-card"
                  style={{
                    border: pack.featured ? '2px solid var(--primary-color)' : '1px solid var(--border-color)',
                  }}
                >
                  {pack.featured && (
                    <div style={{ fontSize: '10px', background: 'var(--primary-color)', color: 'white', fontWeight: '800', padding: '2px 8px', borderRadius: '4px', display: 'inline-block', marginBottom: '8px' }}>
                      BEST VALUE
                    </div>
                  )}
                  <h3 style={{ fontSize: '16px', fontWeight: '800', color: 'var(--text-main)' }}>{pack.name} Pack</h3>
                  <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: '4px 0 12px' }}>{pack.desc}</p>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                    <span style={{ fontSize: '18px', fontWeight: '800', color: 'var(--primary-color)' }}>{pack.coins} Coins</span>
                    <span style={{ fontSize: '16px', fontWeight: '700', color: 'var(--text-main)' }}>₹{pack.price}</span>
                  </div>
                  <button 
                    onClick={() => handleBuyCoins(pack.id)}
                    className="btn-primary"
                    style={{ width: '100%', padding: '10px', fontSize: '13px', marginTop: '12px' }}
                  >
                    Purchase Pack
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'transactions' && (
        <div className="wallet-main-section">
          <h2 className="wallet-section-title">Transaction History</h2>
          {analytics?.recentTransactions && analytics.recentTransactions.length > 0 ? (
            <div style={{ overflowX: 'auto' }}>
              <table>
                <thead>
                  <tr>
                    <th>Type</th>
                    <th>Amount</th>
                    <th>Description</th>
                    <th>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {analytics.recentTransactions.map((tx, index) => {
                    const isCredit = tx.type === 'credit' || tx.type === 'cashback' || tx.type === 'purchase' || tx.type === 'coupon_used';
                    return (
                      <tr key={index}>
                        <td>
                          <span className={`renter-dashboard-booking-status ${isCredit ? 'renter-dashboard-booking-status-completed' : 'renter-dashboard-booking-status-cancelled'}`}>
                            {tx.type}
                          </span>
                        </td>
                        <td style={{ fontWeight: '750', color: isCredit ? 'var(--accent-color)' : '#ef4444' }}>
                          {isCredit ? '+' : '-'}{tx.amount} coins
                        </td>
                        <td>{tx.description}</td>
                        <td>{new Date(tx.createdAt).toLocaleDateString()}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="wallet-empty-state">No transactions recorded yet.</p>
          )}
        </div>
      )}

      {activeTab === 'coupons' && (
        <div className="wallet-main-section">
          <h2 className="wallet-section-title">Active Coupons</h2>
          {wallet?.coupons && wallet.coupons.filter(coupon => !coupon.used && new Date(coupon.expirationDate) > new Date()).length > 0 ? (
            <div className="wallet-coupons-grid">
              {wallet.coupons
                .filter(coupon => !coupon.used && new Date(coupon.expirationDate) > new Date())
                .map((coupon, index) => (
                  <div key={index} className="wallet-coupon-card">
                    <div className="wallet-coupon-header">
                      <span className="wallet-coupon-code">{coupon.code}</span>
                      <span className="wallet-coupon-discount">{coupon.discountPercent}% OFF</span>
                    </div>
                    <p className="wallet-coupon-details">Enjoy {coupon.discountPercent}% off on any vehicle rental checkout discount.</p>
                    <div className="wallet-coupon-expiry">
                      <span>Expires: {new Date(coupon.expirationDate).toLocaleDateString()}</span>
                    </div>
                  </div>
                ))
              }
            </div>
          ) : (
            <p className="wallet-empty-state">No active coupons available in your wallet.</p>
          )}
        </div>
      )}

      {/* Buy Coins Modal overlay */}
      <div id="buy-coins-modal" className="wallet-add-funds-modal">
        <div className="wallet-modal-content">
          <button 
            onClick={() => document.getElementById('buy-coins-modal').classList.add('open')} // Wait, classList.remove('open') is close
            className="wallet-modal-close"
            style={{ border: 'none', background: 'transparent' }}
          >
            ✕
          </button>
          
          <h3 className="wallet-modal-title">Buy Coins</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginBottom: '20px' }}>Select a coin pack to purchase:</p>
          
          <div className="wallet-payment-methods">
            {coinPacks.map(pack => (
              <div 
                key={pack.id}
                className={`wallet-payment-method ${selectedPack === pack.id ? 'selected' : ''}`}
                onClick={() => setSelectedPack(pack.id)}
              >
                <div className="wallet-payment-label">
                  <div>{pack.name} Pack</div>
                  <div style={{ fontSize: '12px', fontWeight: '500', color: 'var(--text-muted)' }}>{pack.desc}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontWeight: '750', color: 'var(--primary-color)' }}>{pack.coins} Coins</div>
                  <div style={{ fontWeight: '600', fontSize: '13px' }}>₹{pack.price}</div>
                </div>
              </div>
            ))}
          </div>
          
          <div className="checkout-modal-actions">
            <button 
              onClick={() => document.getElementById('buy-coins-modal').className = 'wallet-add-funds-modal'}
              className="btn-secondary"
            >
              Cancel
            </button>
            <button 
              onClick={() => {
                if (selectedPack) {
                  handleBuyCoins(selectedPack);
                  document.getElementById('buy-coins-modal').className = 'wallet-add-funds-modal';
                }
              }}
              disabled={!selectedPack}
              className="btn-primary"
            >
              Confirm Purchase
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Wallet;