import React, { useState, useEffect, useContext } from 'react';
import axios from '../utils/axios';
import { Link } from 'react-router-dom';
import { AuthContext } from '../contexts/AuthContext';
import './UserDashboard.css';

const UserDashboard = () => {
  const { user } = useContext(AuthContext);
  const [userData, setUserData] = useState(null);
  const [bookings, setBookings] = useState([]);
  const [payments, setPayments] = useState([]);
  const [wallet, setWallet] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('profile');

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Get user profile
        const profileRes = await axios.get('/api/auth/me');
        setUserData(profileRes.data.user);
        
        // Get user bookings
        const bookingsRes = await axios.get('/api/bookings/mybookings');
        setBookings(bookingsRes.data);
        
        // Get user payments
        const paymentsRes = await axios.get('/api/payments/my-payments');
        setPayments(paymentsRes.data);
        
        // Get user wallet
        const walletRes = await axios.get('/api/wallet/me');
        setWallet(walletRes.data);
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchData();
    } else {
      setLoading(false);
    }
  }, [user]);

  if (!user) {
    return (
      <div className="dashboard-container">
        <div className="dashboard-main-section">
          <h1 className="dashboard-title mb-6">Please Log In</h1>
          <p className="text-gray-600">You need to log in to access your dashboard.</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="dashboard-container">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-300 rounded w-1/3 mb-6"></div>
          <div className="h-64 bg-gray-300 rounded mb-6"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <div>
          <h1 className="dashboard-title">Welcome, {user.name}!</h1>
          <p className="dashboard-welcome">Your personal renter dashboard</p>
        </div>
        <div>
          <span className="renter-dashboard-booking-status renter-dashboard-booking-status-completed">
            {user.role === 'renter' ? 'Renter' : user.role === 'provider' ? 'Car Provider' : 'Admin'}
          </span>
        </div>
      </div>
      
      {/* Quick Stats Grid */}
      <div className="dashboard-stats">
        {user.role === 'renter' && (
          <>
            <div className="dashboard-stat-card" onClick={() => setActiveTab('bookings')} style={{ cursor: 'pointer' }}>
              <h3 className="dashboard-stat-title">My Bookings</h3>
              <p className="dashboard-stat-value">{bookings.length}</p>
              <div className="dashboard-stat-change dashboard-stat-increase">View active & past rentals</div>
            </div>
            <Link to="/cart" className="dashboard-stat-card" style={{ textDecoration: 'none' }}>
              <h3 className="dashboard-stat-title">My Cart</h3>
              <p className="dashboard-stat-value">View Cart</p>
              <div className="dashboard-stat-change dashboard-stat-increase">Check pending items</div>
            </Link>
          </>
        )}
        <div className="dashboard-stat-card" onClick={() => setActiveTab('profile')} style={{ cursor: 'pointer' }}>
          <h3 className="dashboard-stat-title">Account Level</h3>
          <p className="dashboard-stat-value">{wallet?.level || 'Beginner'}</p>
          <div className="dashboard-stat-change dashboard-stat-increase">Earn cashback points</div>
        </div>
      </div>
      
      {/* Wallet Balance section */}
      {wallet && (
        <div className="wallet-balance-section">
          <div>
            <h2 className="wallet-balance-title">Wallet Balance</h2>
            <p className="wallet-balance-amount">{wallet.balance}<span className="wallet-balance-currency">Coins</span></p>
            <p className="opacity-90 mt-1">Status: Level {wallet.level}</p>
          </div>
          <Link to="/wallet" className="wallet-action-button wallet-action-button-add">
            View & Add Funds
          </Link>
        </div>
      )}

      {/* Tab Navigation */}
      <div className="flex border-b mb-6" style={{ display: 'flex', gap: '8px', borderBottom: '1px solid var(--border-color)', marginBottom: '24px' }}>
        <button
          className="nav-link"
          style={{
            border: 'none',
            background: activeTab === 'profile' ? 'var(--primary-color)' : 'transparent',
            color: activeTab === 'profile' ? 'white' : 'var(--text-muted)',
            cursor: 'pointer',
            padding: '8px 16px',
            borderRadius: 'var(--radius-sm)',
            fontWeight: '600'
          }}
          onClick={() => setActiveTab('profile')}
        >
          Profile
        </button>
        <button
          className="nav-link"
          style={{
            border: 'none',
            background: activeTab === 'bookings' ? 'var(--primary-color)' : 'transparent',
            color: activeTab === 'bookings' ? 'white' : 'var(--text-muted)',
            cursor: 'pointer',
            padding: '8px 16px',
            borderRadius: 'var(--radius-sm)',
            fontWeight: '600'
          }}
          onClick={() => setActiveTab('bookings')}
        >
          My Bookings
        </button>
        <button
          className="nav-link"
          style={{
            border: 'none',
            background: activeTab === 'payments' ? 'var(--primary-color)' : 'transparent',
            color: activeTab === 'payments' ? 'white' : 'var(--text-muted)',
            cursor: 'pointer',
            padding: '8px 16px',
            borderRadius: 'var(--radius-sm)',
            fontWeight: '600'
          }}
          onClick={() => setActiveTab('payments')}
        >
          Payment History
        </button>
      </div>

      {/* Profile Tab */}
      {activeTab === 'profile' && userData && (
        <div className="dashboard-main-section">
          <h2 className="dashboard-section-title">Profile Information</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <label style={{ fontSize: '13px', fontWeight: '700', color: 'var(--text-muted)' }}>Full Name</label>
              <p style={{ fontSize: '16px', fontWeight: '600', color: 'var(--text-main)', marginTop: '4px' }}>{userData.name}</p>
            </div>
            <div>
              <label style={{ fontSize: '13px', fontWeight: '700', color: 'var(--text-muted)' }}>Email Address</label>
              <p style={{ fontSize: '16px', fontWeight: '600', color: 'var(--text-main)', marginTop: '4px' }}>{userData.email}</p>
            </div>
            <div>
              <label style={{ fontSize: '13px', fontWeight: '700', color: 'var(--text-muted)' }}>Account Role</label>
              <p style={{ fontSize: '16px', fontWeight: '600', color: 'var(--text-main)', marginTop: '4px', textTransform: 'capitalize' }}>{userData.role}</p>
            </div>
          </div>
        </div>
      )}

      {/* Bookings Tab */}
      {activeTab === 'bookings' && (
        <div className="dashboard-main-section">
          <h2 className="dashboard-section-title">My Bookings</h2>
          
          {bookings.length === 0 ? (
            <p className="dashboard-empty-state">You haven't made any bookings yet.</p>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table>
                <thead>
                  <tr>
                    <th>Car</th>
                    <th>Dates</th>
                    <th>Total Price</th>
                    <th>Coins Paid</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {bookings.map((booking) => (
                    <tr key={booking._id}>
                      <td style={{ fontWeight: '700' }}>
                        <div>{booking.car?.name || "Deleted Car"}</div>
                        <div style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: '500', marginTop: '2px' }}>
                          {booking.car ? `${booking.car.brand} • ${booking.car.year}` : "N/A"}
                        </div>
                      </td>
                      <td>
                        {new Date(booking.startDate).toLocaleDateString()} - {new Date(booking.endDate).toLocaleDateString()}
                      </td>
                      <td style={{ fontWeight: '700', color: 'var(--primary-color)' }}>
                        {booking.totalPrice} coins
                      </td>
                      <td style={{ fontWeight: '700' }}>
                        {booking.coinsPaid} coins
                      </td>
                      <td>
                        <span className={`renter-dashboard-booking-status renter-dashboard-booking-status-${booking.bookingStatus}`}>
                          {booking.bookingStatus}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Payments Tab */}
      {activeTab === 'payments' && (
        <div className="dashboard-main-section">
          <h2 className="dashboard-section-title">Payment History</h2>
          
          {payments.length === 0 ? (
            <p className="dashboard-empty-state">No payment history found.</p>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table>
                <thead>
                  <tr>
                    <th>Booking</th>
                    <th>Amount</th>
                    <th>Date</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {payments.map((payment) => (
                    <tr key={payment._id}>
                      <td style={{ fontWeight: '700' }}>
                        {payment.booking && payment.booking.car ? 
                          `${payment.booking.car.name} (${payment.booking.car.brand})` : 
                          'N/A'}
                      </td>
                      <td style={{ fontWeight: '700', color: 'var(--primary-color)' }}>
                        {payment.amount} coins
                      </td>
                      <td>
                        {new Date(payment.createdAt).toLocaleDateString()}
                      </td>
                      <td>
                        <span className={`renter-dashboard-booking-status ${payment.status === 'success' ? 'renter-dashboard-booking-status-completed' : 'renter-dashboard-booking-status-cancelled'}`}>
                          {payment.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default UserDashboard;