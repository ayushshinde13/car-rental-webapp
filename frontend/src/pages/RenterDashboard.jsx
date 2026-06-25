import React from 'react';
import { Link } from 'react-router-dom';
import { AuthContext } from '../contexts/AuthContext';
import CarList from '../components/CarList';
import './RenterDashboard.css';

const RenterDashboard = () => {
  const { user } = React.useContext(AuthContext);

  if (!user) {
    return (
      <div className="dashboard-access-denied">
        <h2>Please log in to access the dashboard</h2>
        <Link to="/login" className="login-redirect-btn">Go to Login</Link>
      </div>
    );
  }

  if (user.role !== 'renter') {
    return (
      <div className="dashboard-access-denied">
        <h2>Access Denied</h2>
        <p>Only renters can access this dashboard.</p>
        <Link to="/" className="home-redirect-btn">Go to Home</Link>
      </div>
    );
  }

  return (
    <div className="renter-dashboard-container">
      <header className="dashboard-header">
        <h1>Renter Dashboard</h1>
        <p>Welcome, {user.name}! Manage your rentals and bookings.</p>
      </header>

      <div className="dashboard-content">
        <div className="dashboard-section">
          <h2>Find Cars</h2>
          <CarList />
        </div>

        <div className="dashboard-section">
          <h2>Your Bookings</h2>
          <p>Track your current and past bookings.</p>
          {/* Placeholder for bookings list */}
        </div>

        <div className="dashboard-section">
          <h2>Wallet</h2>
          <p>Current coins: {user.coins || 0}</p>
          <Link to="/wallet" className="wallet-link">Manage Wallet</Link>
        </div>
      </div>
    </div>
  );
};

export default RenterDashboard;