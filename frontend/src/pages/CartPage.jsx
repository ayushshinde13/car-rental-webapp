import React, { useContext, useState, useEffect } from 'react';
import { AuthContext } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import axios from '../utils/axios';
import './CartPage.css';

const CartPage = () => {
  const { cart, removeFromCart } = useContext(AuthContext);
  const navigate = useNavigate();

  // Modal State
  const [selectedCar, setSelectedCar] = useState(null);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [couponCode, setCouponCode] = useState('');
  const [availableCoupons, setAvailableCoupons] = useState([]);
  const [walletBalance, setWalletBalance] = useState(0);
  const [bookingLoading, setBookingLoading] = useState(false);
  const [bookingError, setBookingError] = useState('');

  // Fetch coupons & wallet balance when opening checkout modal
  useEffect(() => {
    if (selectedCar) {
      const fetchWallet = async () => {
        try {
          const res = await axios.get('/api/wallet/me');
          setWalletBalance(res.data.balance || 0);
          
          const validCoupons = (res.data.coupons || []).filter(coupon => 
            !coupon.used && new Date(coupon.expirationDate) > new Date()
          );
          setAvailableCoupons(validCoupons);
        } catch (err) {
          console.error('Error fetching wallet information:', err);
        }
      };

      fetchWallet();
      setStartDate('');
      setEndDate('');
      setCouponCode('');
      setBookingError('');
    }
  }, [selectedCar]);

  // Handle opening modal for a specific car
  const openBookingModal = (carItem) => {
    setSelectedCar(carItem);
  };

  // Handle closing modal
  const closeBookingModal = () => {
    setSelectedCar(null);
  };

  // Calculate booking details dynamically
  let totalDays = 0;
  let totalCost = 0;
  let discountAmount = 0;
  let finalCost = 0;

  if (selectedCar && startDate) {
    totalDays = selectedCar.rentalDuration;
    
    // Auto-calculate End Date based on Start Date and duration (days)
    const start = new Date(startDate);
    const end = new Date(start.getTime() + totalDays * 24 * 60 * 60 * 1000);
    
    // Format YYYY-MM-DD
    if (!isNaN(end.getTime())) {
      const year = end.getFullYear();
      const month = String(end.getMonth() + 1).padStart(2, '0');
      const day = String(end.getDate()).padStart(2, '0');
      
      // Calculate End Date string
      if (!endDate) {
        setEndDate(`${year}-${month}-${day}`);
      }
    }
    
    totalCost = selectedCar.car.pricePerDay * totalDays;
    
    if (couponCode) {
      const coupon = availableCoupons.find(c => c.code === couponCode);
      if (coupon) {
        discountAmount = Math.floor(totalCost * (coupon.discountPercent / 100));
      }
    }
    
    finalCost = totalCost - discountAmount;
  }

  // Handle date change
  const handleStartDateChange = (val) => {
    setStartDate(val);
    setEndDate(''); // Clear end date so it auto-recalculates
  };

  // Handle Checkout submission
  const handleCheckoutSubmit = async (e) => {
    e.preventDefault();
    if (!startDate || !endDate) {
      setBookingError('Please select a start date.');
      return;
    }

    if (walletBalance < finalCost) {
      setBookingError(`Insufficient balance. You need ${finalCost} coins but only have ${walletBalance} coins.`);
      return;
    }

    setBookingLoading(true);
    setBookingError('');

    try {
      // Create booking on backend
      const res = await axios.post('/api/bookings', {
        carId: selectedCar.car._id,
        startDate,
        endDate,
        ...(couponCode && { couponCode })
      });

      if (res.status === 201 || res.status === 200) {
        alert('Booking created successfully! Coins deducted from your wallet.');
        // Remove item from cart
        await removeFromCart(selectedCar.car._id);
        closeBookingModal();
        navigate('/dashboard'); // Go to user dashboard
      }
    } catch (err) {
      console.error('Error creating booking:', err);
      setBookingError(err.response?.data?.message || 'Failed to create booking.');
    } finally {
      setBookingLoading(false);
    }
  };

  const apiBaseUrl = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000';

  return (
    <div className="cart-page container">
      <h1>Your Rental Cart</h1>
      
      {!cart || cart.length === 0 ? (
        <div className="empty-cart">
          <p>Your cart is empty</p>
          <p>Browse vehicles and add them to your cart to rent them!</p>
          <button onClick={() => navigate('/')} className="btn-primary" style={{marginTop: '20px'}}>
            Browse Cars
          </button>
        </div>
      ) : (
        <div className="cart-container">
          <div className="cart-items">
            {cart.map((item, idx) => {
              if (!item.car) return null;
              
              const imageUrl = item.car.images && item.car.images.length > 0
                ? (item.car.images[0].startsWith('http') ? item.car.images[0] : `${apiBaseUrl}${item.car.images[0]}`)
                : '/placeholder-car.jpg';

              return (
                <div key={item.car._id || idx} className="cart-item">
                  <div className="cart-item-image-wrapper">
                    <img src={imageUrl} alt={item.car.name} className="cart-item-img" />
                  </div>
                  
                  <div className="cart-item-details">
                    <h3>{item.car.name}</h3>
                    <p className="cart-item-meta">{item.car.brand} • {item.car.model}</p>
                    <p className="cart-item-duration">Duration: <strong>{item.rentalDuration} day{item.rentalDuration > 1 ? 's' : ''}</strong></p>
                    <p className="cart-item-price">Daily rate: <strong>{item.car.pricePerDay} coins</strong></p>
                    <div className="cart-item-total">
                      Total: <span>{item.car.pricePerDay * item.rentalDuration} coins</span>
                    </div>
                  </div>
                  
                  <div className="cart-item-actions">
                    <button 
                      onClick={() => openBookingModal(item)} 
                      className="checkout-btn"
                    >
                      Book Now
                    </button>
                    <button 
                      onClick={() => removeFromCart(item.car._id)} 
                      className="remove-btn"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Booking Checkout Modal */}
      {selectedCar && (
        <div className="checkout-modal-overlay">
          <div className="checkout-modal">
            <div className="checkout-modal-header">
              <h2>Confirm Booking</h2>
              <button className="close-modal-btn" onClick={closeBookingModal}>✕</button>
            </div>
            
            <form onSubmit={handleCheckoutSubmit} className="checkout-modal-body">
              <div className="checkout-car-preview">
                <h4>{selectedCar.car.name}</h4>
                <p>{selectedCar.car.brand} • {selectedCar.car.model}</p>
                <div className="duration-badge">
                  {selectedCar.rentalDuration} Day Rental
                </div>
              </div>

              {bookingError && <div className="checkout-error">{bookingError}</div>}

              <div className="form-group">
                <label>Wallet Balance</label>
                <div className="wallet-balance-indicator">
                  <strong>{walletBalance} coins</strong> available
                </div>
              </div>

              <div className="form-group">
                <label>Rental Start Date</label>
                <input 
                  type="date" 
                  value={startDate}
                  onChange={(e) => handleStartDateChange(e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                  required
                  className="form-control"
                />
              </div>

              {startDate && (
                <div className="form-group">
                  <label>Rental End Date</label>
                  <input 
                    type="date" 
                    value={endDate}
                    readOnly
                    className="form-control read-only-input"
                  />
                  <small className="form-text">Automatically calculated based on your cart duration.</small>
                </div>
              )}

              <div className="form-group">
                <label>Apply Coupon</label>
                {availableCoupons.length > 0 ? (
                  <select 
                    value={couponCode} 
                    onChange={(e) => setCouponCode(e.target.value)}
                    className="form-control"
                  >
                    <option value="">No coupon applied</option>
                    {availableCoupons.map((coupon, i) => (
                      <option key={i} value={coupon.code}>
                        {coupon.code} ({coupon.discountPercent}% Off)
                      </option>
                    ))}
                  </select>
                ) : (
                  <div className="no-coupons-placeholder">No coupons available in your wallet.</div>
                )}
              </div>

              {startDate && (
                <div className="cost-breakdown">
                  <h5>Cost Summary</h5>
                  <div className="cost-row">
                    <span>Base Price ({selectedCar.car.pricePerDay} x {selectedCar.rentalDuration} days):</span>
                    <span>{totalCost} coins</span>
                  </div>
                  {discountAmount > 0 && (
                    <div className="cost-row discount">
                      <span>Coupon Discount:</span>
                      <span>-{discountAmount} coins</span>
                    </div>
                  )}
                  <div className="cost-row total">
                    <span>Final Cost:</span>
                    <span>{finalCost} coins</span>
                  </div>
                </div>
              )}

              <div className="checkout-modal-actions">
                <button 
                  type="button" 
                  onClick={closeBookingModal} 
                  className="btn-secondary"
                  disabled={bookingLoading}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="btn-primary checkout-confirm-btn"
                  disabled={bookingLoading || !startDate}
                >
                  {bookingLoading ? 'Processing...' : 'Confirm & Rent'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default CartPage;