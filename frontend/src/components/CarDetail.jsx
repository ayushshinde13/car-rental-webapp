import React, { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from '../utils/axios';
import { AuthContext } from '../contexts/AuthContext';
import './CarDetail.css';

const CarDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [car, setCar] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { user, addToCart } = useContext(AuthContext);
  const [rentalDays, setRentalDays] = useState(1);
  const [addedToCart, setAddedToCart] = useState(false);
  const apiBaseUrl = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000';

  useEffect(() => {
    const fetchCarDetails = async () => {
      try {
        const response = await axios.get(`/api/cars/${id}`);
        setCar(response.data);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to fetch car details');
      } finally {
        setLoading(false);
      }
    };

    fetchCarDetails();
  }, [id]);

  const handleAddToCart = async () => {
    if (!user) {
      navigate('/login');
      return;
    }

    if (user.role !== 'renter') {
      alert('Only renters can add cars to cart');
      return;
    }

    try {
      await addToCart(car._id, parseInt(rentalDays));
      setAddedToCart(true);
      setTimeout(() => setAddedToCart(false), 3000);
    } catch (err) {
      console.error("Error adding to cart:", err);
      alert(err.message);
    }
  };

  if (loading) {
    return (
      <div className="car-detail-container">
        <div style={{ textAlign: 'center', padding: '40px 0' }}>
          <div style={{ width: '40px', height: '40px', border: '3px solid var(--border-color)', borderTopColor: 'var(--primary-color)', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto' }}></div>
          <p style={{ marginTop: '16px', color: 'var(--text-muted)' }}>Loading car details...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="car-detail-container">
        <div className="checkout-error" style={{ margin: '20px 0', textAlign: 'center' }}>
          <h3>Error</h3>
          <p>{error}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="btn-primary"
            style={{ marginTop: '16px', display: 'block', margin: '16px auto 0' }}
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!car) {
    return (
      <div className="car-detail-container">
        <div style={{ textAlign: 'center', padding: '40px 0' }}>
          <h2>Car not found</h2>
          <button 
            onClick={() => navigate('/')} 
            className="btn-primary"
            style={{ marginTop: '16px', display: 'block', margin: '16px auto 0' }}
          >
            Go Back Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="car-detail-container">
      {/* Left section: Image */}
      <div className="car-images-section">
        <button
          onClick={() => navigate(-1)}
          className="btn-secondary"
          style={{ marginBottom: '20px', marginLeft: '0', display: 'inline-flex', padding: '8px 16px' }}
        >
          ← Back
        </button>
        <div style={{ borderRadius: 'var(--radius-lg)', overflow: 'hidden', height: '350px', border: '1px solid var(--border-color)' }}>
          <img 
            src={
              car.images && car.images.length > 0
                ? (car.images[0].startsWith('http') ? car.images[0] : `${apiBaseUrl}${car.images[0]}`)
                : '/placeholder-car.jpg'
            } 
            alt={car.name} 
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
        </div>
      </div>

      {/* Right section: Info */}
      <div className="car-info-section">
        <div className="car-basic-info">
          <h1>{car.name}</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '15px', fontWeight: '500' }}>{car.brand} • {car.model}</p>
        </div>

        {/* Specifications Grid */}
        <div className="car-specs">
          <div className="spec">
            <span className="spec-label">Brand</span>
            <span className="spec-value">{car.brand}</span>
          </div>
          <div className="spec">
            <span className="spec-label">Model</span>
            <span className="spec-value">{car.model}</span>
          </div>
          <div className="spec">
            <span className="spec-label">Year</span>
            <span className="spec-value">{car.year}</span>
          </div>
          <div className="spec">
            <span className="spec-label">Status</span>
            <span className="spec-value" style={{ color: car.available ? 'var(--accent-color)' : '#ef4444' }}>
              {car.available ? 'Available' : 'Booked / Maintenance'}
            </span>
          </div>
        </div>

        {/* Price display */}
        <div className="price-section">
          <div className="daily-price">
            <span className="price">{car.pricePerDay} coins</span>
            <span className="per-day">/ day</span>
          </div>
          <div className="total-price">
            <span>Estimated Total ({rentalDays} Day{rentalDays > 1 ? 's' : ''}):</span>
            <span style={{ color: 'var(--primary-color)' }}>{car.pricePerDay * rentalDays} coins</span>
          </div>
        </div>

        {/* Action Controls */}
        <div className="rental-controls">
          <div className="duration-control">
            <label htmlFor="rental-days">Select Rental Duration (Days)</label>
            <input
              type="number"
              id="rental-days"
              min="1"
              max="365"
              value={rentalDays}
              onChange={(e) => setRentalDays(Math.max(1, parseInt(e.target.value) || 1))}
              className="form-control"
            />
          </div>

          <button
            onClick={handleAddToCart}
            disabled={addedToCart || !car.available}
            className={`add-to-cart-btn ${addedToCart ? 'added' : ''}`}
          >
            {addedToCart ? 'Added to Cart!' : !car.available ? 'Not Available' : 'Add to Cart'}
          </button>
        </div>

        {/* Provider info */}
        {car.provider && (
          <div className="provider-info" style={{ fontSize: '13px', color: 'var(--text-muted)', display: 'flex', gap: '6px' }}>
            <span>Listed by provider: </span>
            <strong style={{ color: 'var(--text-main)' }}>{car.provider.name}</strong>
          </div>
        )}
      </div>
    </div>
  );
};

export default CarDetail;
