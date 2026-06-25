import React from 'react';
import { Link } from 'react-router-dom';
import { AuthContext } from '../contexts/AuthContext';
import CarList from '../components/CarList';
import './ProviderDashboard.css';

const ProviderDashboard = () => {
  const { user } = React.useContext(AuthContext);

  if (!user) {
    return (
      <div className="dashboard-access-denied">
        <h2>Please log in to access the dashboard</h2>
        <Link to="/login" className="login-redirect-btn">Go to Login</Link>
      </div>
    );
  }

  if (user.role !== 'provider') {
    return (
      <div className="dashboard-access-denied">
        <h2>Access Denied</h2>
        <p>Only providers can access this dashboard.</p>
        <Link to="/" className="home-redirect-btn">Go to Home</Link>
      </div>
    );
  }

  return (
    <div className="provider-dashboard-shell">
    <div className="provider-dashboard-container">
      <header className="dashboard-header">
        <h1>Provider Dashboard</h1>
        <p>Welcome, {user.name}! Manage your cars and rentals.</p>
      </header>

      <div className="dashboard-content">
        <div className="dashboard-section">
          <h2>Your Cars</h2>
          <Link to="/addcar" className="add-car-btn">Add New Car</Link>
          <CarList providerId={user.id || user._id} />
        </div>

        <div className="dashboard-section">
          <h2>Your Rentals</h2>
          <p>Manage your rental requests and earnings.</p>
          {/* Placeholder for rentals list */}
        </div>
      </div>
    </div>
    </div>
  );
};

export default ProviderDashboard;
