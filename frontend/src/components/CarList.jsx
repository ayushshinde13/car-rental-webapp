import React, { useState, useEffect, useContext } from 'react';
import { Link } from 'react-router-dom';
import axios from '../utils/axios';
import { AuthContext } from '../contexts/AuthContext';
import './CarList.css';

const CarList = ({ providerId }) => {
  const [cars, setCars] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filteredCars, setFilteredCars] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState('all');
  const { user, addToCart } = useContext(AuthContext);
  const apiBaseUrl = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000';

  useEffect(() => {
    const fetchCars = async () => {
      try {
        const response = await axios.get('/api/cars', {
          params: providerId ? { provider: providerId } : {}
        });
        const data = Array.isArray(response.data) ? response.data : [];
        setCars(data);
        setLoading(false);
      } catch (err) {
        setError('Failed to load cars');
        setLoading(false);
        console.error('Error fetching cars:', err);
      }
    };

    fetchCars();
  }, [providerId]);

  useEffect(() => {
    let result = Array.isArray(cars) ? [...cars] : [];

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(car =>
        car.name.toLowerCase().includes(term) ||
        car.brand.toLowerCase().includes(term) ||
        car.model.toLowerCase().includes(term)
      );
    }

    if (filter === 'available') {
      result = result.filter(car => car.available);
    } else if (filter === 'unavailable') {
      result = result.filter(car => !car.available);
    }

    setFilteredCars(result);
  }, [searchTerm, filter, cars]);

  const handleAddToCart = async (carId) => {
    if (!user) {
      window.location.href = '/login';
      return;
    }
    if (user.role !== 'renter') {
      alert('Only renters can book cars.');
      return;
    }
    try {
      await addToCart(carId, 1);
      alert('Car added to cart');
    } catch (error) {
      console.error('Error adding to cart:', error);
      alert(error.message || 'Failed to add car to cart');
    }
  };

  if (loading) {
    return (
      <div className="car-list-loading">
        <div className="car-list-loading-spinner"></div>
      </div>
    );
  }

  if (error) {
    return <div className="car-list-no-results">{error}</div>;
  }

  return (
    <div className="car-list-container">
      <div className="car-list-header">
        <h2 className="car-list-title">Available Cars</h2>
        <div className="car-list-controls">
          <input
            type="text"
            placeholder="Search cars..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="car-list-search"
          />
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="car-list-filter"
          >
            <option value="all">All Cars</option>
            <option value="available">Available</option>
            <option value="unavailable">Unavailable</option>
          </select>
        </div>
      </div>

      <div className="car-list-results-count">
        {filteredCars.length} {filteredCars.length === 1 ? 'car' : 'cars'} found
      </div>

      {filteredCars.length === 0 ? (
        <div className="car-list-no-results">No cars match your search.</div>
      ) : (
        <div className="car-list-grid">
          {filteredCars.map((car) => {
            const imageUrl = car.images && car.images.length > 0
              ? (car.images[0].startsWith('http') ? car.images[0] : `${apiBaseUrl}${car.images[0]}`)
              : '';

            return (
              <div key={car._id} className="car-list-card">
                <div className="car-list-image-container">
                  {imageUrl ? (
                    <img src={imageUrl} alt={car.name} className="car-list-image" />
                  ) : (
                    <div className="car-list-image">No Image</div>
                  )}
                  {!car.available && <span className="car-list-badge">Unavailable</span>}
                </div>
                <div className="car-list-content">
                  <h3 className="car-list-card-title">{car.name}</h3>
                  <div className="car-list-card-price">
                    {car.pricePerDay} coins <span>/ day</span>
                  </div>
                  <div className="car-list-specs">
                    <div className="car-list-spec">
                      <span className="car-list-spec-label">Brand</span>
                      <span className="car-list-spec-value">{car.brand}</span>
                    </div>
                    <div className="car-list-spec">
                      <span className="car-list-spec-label">Model</span>
                      <span className="car-list-spec-value">{car.model}</span>
                    </div>
                    <div className="car-list-spec">
                      <span className="car-list-spec-label">Year</span>
                      <span className="car-list-spec-value">{car.year}</span>
                    </div>
                  </div>
                  <div className="car-list-card-actions">
                    <Link to={`/car/${car._id}`} className="car-list-card-button car-list-card-button-details">
                      View Details
                    </Link>
                    {user?.role === 'renter' && (
                      <button
                        type="button"
                        className="car-list-card-button car-list-card-button-book"
                        onClick={() => handleAddToCart(car._id)}
                        disabled={!car.available}
                      >
                        Book
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default CarList;
