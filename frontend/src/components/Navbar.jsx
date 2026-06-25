// src/components/Navbar.jsx
import React, { useState, useContext } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ShoppingCart } from 'lucide-react';
import { AuthContext } from "../contexts/AuthContext";
import "./Navbar.css";

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();
  const { user, cart, logout } = useContext(AuthContext);

  const getDashboardPath = () => {
    if (!user || !user.role) return "/";
    switch (user.role) {
      case 'provider':
        return '/provider-dashboard';
      case 'renter':
        return '/renter-dashboard';
      default:
        return '/';
    }
  };

  const handleLogout = () => {
    logout();
    setIsOpen(false);
    navigate("/login");
  };

  const closeMenu = () => {
    setIsOpen(false);
  };

  return (
    <nav className="navbar">
      <div className="navbar-inner">
        <div className="flex justify-between items-center h-16">
          <div className="logo">
            <Link to="/" onClick={closeMenu}>
              <span>🚗 CarRentalApp</span>
            </Link>
          </div>

          {/* Desktop Menu */}
          <div className={`nav-links ${isOpen ? 'active' : ''}`}>
            <Link to="/" className="nav-link" onClick={closeMenu}>Home</Link>
            <Link to="/about" className="nav-link" onClick={closeMenu}>About</Link>
            <Link to="/help" className="nav-link" onClick={closeMenu}>Help</Link>

            {user ? (
              <>
                {/* Show Add Car only for providers */}
                {user.role === "provider" && (
                  <Link to="/addcar" className="nav-link" onClick={closeMenu}>Add Car</Link>
                )}
                
                {/* Show Admin Dashboard only for admins */}
                {user.role === "admin" && (
                  <Link to="/admin-dashboard" className="nav-link" onClick={closeMenu}>Admin Dashboard</Link>
                )}
                
                {/* Dashboard link - changes based on user role */}
                <Link to={getDashboardPath()} className="nav-link" onClick={closeMenu}>Dashboard</Link>
                
                {/* Wallet link for all users */}
                <Link to="/wallet" className="nav-link" onClick={closeMenu}>Wallet</Link>
                
                {/* Cart link for renters only */}
                {user.role === 'renter' && (
                  <Link to="/cart" className="nav-link" onClick={closeMenu}>Cart</Link>
                )}
                
                <button onClick={handleLogout} className="logout-btn">Logout</button>
              </>
            ) : (
              <>
                <Link to="/login" className="nav-link bg-blue-600 hover:bg-blue-700" onClick={closeMenu}>Login</Link>
                <Link to="/register" className="nav-link bg-green-600 hover:bg-green-700 ml-2" onClick={closeMenu}>Register</Link>
              </>
            )}
            
            {/* Cart Icon - only for renters */}
            {user && user.role === 'renter' && (
              <Link to="/cart" className="cart-icon-btn" onClick={closeMenu}>
                <ShoppingCart size={20} />
                {cart && cart.length > 0 && (
                  <span className="cart-count">{cart.length}</span>
                )}
              </Link>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="mobile-menu-btn" onClick={() => setIsOpen(!isOpen)}>
            <svg
              className={`${isOpen ? "hidden" : "block"} h-6 w-6`}
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
            <svg
              className={`${isOpen ? "block" : "hidden"} h-6 w-6`}
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
