import React, { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from '../utils/axios';
import { AuthContext } from '../contexts/AuthContext';

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
      <div className="min-h-screen bg-gray-50 text-gray-900 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-300 rounded w-1/3 mb-6"></div>
            <div className="h-64 bg-gray-300 rounded mb-6"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 text-gray-900 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
            <h3 className="font-bold">Error</h3>
            <p>{error}</p>
            <button 
              onClick={() => window.location.reload()} 
              className="mt-3 bg-red-600 hover:bg-red-700 text-white py-2 px-4 rounded"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!car) {
    return (
      <div className="min-h-screen bg-gray-50 text-gray-900 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-2xl font-bold">Car not found</h2>
            <button 
              onClick={() => navigate('/')} 
              className="mt-4 bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded"
            >
              Go Back Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 py-8">
      {/* Car Details Section */}
      <section className="py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <button
            onClick={() => navigate(-1)}
            className="mb-6 flex items-center text-blue-600 hover:text-blue-800"
          >
            <span className="mr-2">←</span> Back to Cars
          </button>

          <div className="lg:grid lg:grid-cols-2 lg:gap-x-8 lg:items-start">
            <div className="bg-white rounded-xl shadow-lg overflow-hidden">
              {/* Car Image */}
              <div className="relative">
                  <img 
                  src={
                    car.images && car.images.length > 0
                      ? (car.images[0].startsWith('http') ? car.images[0] : `${apiBaseUrl}${car.images[0]}`)
                      : '/placeholder-car.jpg'
                  } 
                  alt={car.name} 
                  className="w-full h-96 object-cover"
                />
              </div>

              <div className="p-6">
                <div className="flex flex-col md:flex-row justify-between">
                  <div>
                    <h1 className="text-3xl font-bold text-gray-900">{car.name}</h1>
                    <p className="text-gray-600 mt-2">{car.brand} • {car.model}</p>
                  </div>
                </div>

                {/* Car Details */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8">
                  <div className="text-center p-4 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-600">Brand</p>
                    <p className="font-semibold">{car.brand}</p>
                  </div>
                  <div className="text-center p-4 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-600">Model</p>
                    <p className="font-semibold">{car.model}</p>
                  </div>
                  <div className="text-center p-4 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-600">Year</p>
                    <p className="font-semibold">{car.year}</p>
                  </div>
                  <div className="text-center p-4 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-600">Status</p>
                    <p className={`font-semibold ${car.available ? 'text-green-600' : 'text-red-600'}`}>
                      {car.available ? 'Available' : 'Not Available'}
                    </p>
                  </div>
                </div>

                {/* Rental Days Input */}
                <div className="mt-8">
                  <label htmlFor="rental-days" className="block text-sm font-medium text-gray-700 mb-2">
                    Rental Days
                  </label>
                  <input
                    type="number"
                    id="rental-days"
                    min="1"
                    max="365"
                    value={rentalDays}
                    onChange={(e) => setRentalDays(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                {/* Add to Cart Button */}
                <div className="mt-6">
                  <button
                    onClick={handleAddToCart}
                    disabled={addedToCart}
                    className={`w-full py-3 px-6 rounded-lg font-semibold text-white ${
                      addedToCart 
                        ? 'bg-green-600' 
                        : 'bg-blue-600 hover:bg-blue-700'
                    }`}
                  >
                    {addedToCart ? 'Added to Cart!' : 'Add to Cart'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default CarDetail;
