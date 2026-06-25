import React, { useState, useEffect } from 'react';
import axios from '../utils/axios';

const BookingForm = ({ car, onSubmit, onCancel }) => {
  // Removed theme functionality as per project specification
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [couponCode, setCouponCode] = useState('');
  const [availableCoupons, setAvailableCoupons] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Fetch available coupons for the user
    const fetchCoupons = async () => {
      try {
        const walletRes = await axios.get('/api/wallet/me');
        const validCoupons = walletRes.data.coupons.filter(coupon => 
          !coupon.used && new Date(coupon.expirationDate) > new Date()
        );
        setAvailableCoupons(validCoupons);
      } catch (err) {
        console.error('Error fetching coupons:', err);
      }
    };

    fetchCoupons();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const bookingData = {
        carId: car._id,
        startDate,
        endDate,
        ...(couponCode && { couponCode }) // Only include couponCode if it's provided
      };

      await onSubmit(bookingData);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create booking');
    } finally {
      setLoading(false);
    }
  };

  // Calculate total days and cost
  let totalDays = 0;
  let totalCost = 0;
  let discountAmount = 0;
  let finalCost = 0;

  if (startDate && endDate) {
    const start = new Date(startDate);
    const end = new Date(endDate);
    totalDays = Math.ceil((end - start) / (1000 * 60 * 60 * 24));
    
    totalCost = car.coinsRequired * totalDays;
    
    // Calculate discount if coupon is applied
    if (couponCode) {
      const coupon = availableCoupons.find(c => c.code === couponCode);
      if (coupon) {
        discountAmount = Math.floor(totalCost * (coupon.discountPercent / 100));
      }
    }
    
    finalCost = totalCost - discountAmount;
  }

  return (
    <div className="max-w-2xl mx-auto p-6 rounded-xl shadow-lg bg-white">
      <h2 className="text-2xl font-bold mb-6">Book {car.name}</h2>
      
      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div>
            <label className="block text-sm font-medium mb-2">Start Date</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-800 border-gray-300"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-2">End Date</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-800 border-gray-300"
              required
            />
          </div>
        </div>
        
        {/* Coupon Section */}
        <div className="mb-6">
          <label className="block text-sm font-medium mb-2">Coupon Code (Optional)</label>
          <div className="flex gap-2">
            <select
              value={couponCode}
              onChange={(e) => setCouponCode(e.target.value)}
              className="flex-1 px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-800 border-gray-300"
            >
              <option value="">Select a coupon</option>
              {availableCoupons.map((coupon) => (
                <option key={coupon._id} value={coupon.code}>
                  {coupon.code} ({coupon.discountPercent}% off) - Exp: {new Date(coupon.expirationDate).toLocaleDateString()}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={() => setCouponCode('')}
              className="px-4 py-2 bg-gray-200 rounded-md"
            >
              Clear
            </button>
          </div>
        </div>
        
        {/* Cost Breakdown */}
        {totalDays > 0 && (
          <div className="mb-6 p-4 rounded-lg bg-gray-100">
            <h3 className="font-bold mb-2">Cost Breakdown</h3>
            <div className="space-y-1">
              <div className="flex justify-between">
                <span>Base Cost:</span>
                <span>{totalCost} coins ({car.coinsRequired} coins/day × {totalDays} days)</span>
              </div>
              {discountAmount > 0 && (
                <div className="flex justify-between text-green-600">
                  <span>Discount:</span>
                  <span>-{discountAmount} coins</span>
                </div>
              )}
              <div className="flex justify-between font-bold pt-2 border-t border-gray-300">
                <span>Total:</span>
                <span>{finalCost} coins</span>
              </div>
            </div>
          </div>
        )}
        
        {error && (
          <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
            {error}
          </div>
        )}
        
        <div className="flex space-x-4">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 py-2 px-4 rounded-md font-medium bg-gray-200 hover:bg-gray-300 text-gray-800"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading || totalDays <= 0 || finalCost <= 0}
            className={`flex-1 py-2 px-4 rounded-md font-medium text-white ${
              loading || totalDays <= 0 || finalCost <= 0
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-700'
            }`}
          >
            {loading ? 'Booking...' : 'Confirm Booking'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default BookingForm;