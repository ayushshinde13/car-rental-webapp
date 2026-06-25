import React from 'react';
import { Link } from 'react-router-dom';
import './CarCard.css';

const CarCard = ({ car, onAddToCart }) => {
  if (!car) return null;

  return (
    <div className="car-card">
      <div className="car-image">
        {car.images && car.images.length > 0 ? (
          <img src={car.images[0]} alt={car.name} />
        ) : (
          <div className="no-image">No Image Available</div>
        )}
      </div>
      
      <div className="car-details">
        <h3>{car.name}</h3>
        <p className="car-brand-model">{car.brand} • {car.model}</p>
        <p className="car-year">{car.year}</p>
        <p className="car-price">${car.price} <span>per day</span></p>
        <p className="car-description">{car.description}</p>
        
        <div className="card-actions">
          <Link to={`/car/${car._id}`} className="view-details-btn">View Details</Link>
          {onAddToCart && (
            <button 
              onClick={(e) => {
                e.stopPropagation();
                onAddToCart(car._id);
              }} 
              className="add-to-cart-btn"
            >
              Add to Cart
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default CarCard;