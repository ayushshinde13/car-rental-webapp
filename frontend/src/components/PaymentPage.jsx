import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from '../utils/axios';
import { loadStripe } from '@stripe/stripe-js';

const PaymentPage = () => {
  const { bookingId } = useParams();
  const navigate = useNavigate();
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('');
  const [confirming, setConfirming] = useState(false);

  const handleConfirmPayment = async () => {
    if (!paymentMethod) {
      setError('Please select a payment method');
      return;
    }
    
    setConfirming(true);

    try {
      // Process payment based on selected method
      if (paymentMethod === 'wallet') {
        // Deduct coins from wallet
        const response = await axios.post('/api/wallet/process-booking-payment', {
          bookingId,
          amount: parseFloat((booking.totalPrice * 1.1).toFixed(2))
        });
        
        if (response.data.success) {
          alert('Payment successful!');
          navigate('/dashboard');
        } else {
          setError(response.data.message || 'Payment failed');
        }
      } else if (paymentMethod === 'credit-card') {
        // Create payment intent
        const response = await axios.post('/api/payments/create-payment-intent', {
          bookingId,
          amount: Math.round(booking.totalPrice * 1.1 * 100) // Convert to cents
        });

        // Load Stripe
        const stripe = await loadStripe(process.env.REACT_APP_STRIPE_PUBLISHABLE_KEY);

        // Confirm payment
        const result = await stripe.confirmCardPayment(response.data.clientSecret, {
          payment_method: {
            card: null, // This would be handled by the Stripe Elements component
            billing_details: {
              name: localStorage.getItem('userName') || 'Customer',
            },
          }
        });

        if (result.error) {
          console.error('Payment error:', result.error);
          setError(result.error.message);
        } else {
          // Payment succeeded
          alert('Payment successful!');
          navigate('/dashboard');
        }
      } else if (paymentMethod === 'paypal') {
        // Handle PayPal payment
        // This would typically redirect to PayPal or use PayPal SDK
        alert('Redirecting to PayPal...');
        // In a real app, integrate with PayPal SDK here
        navigate('/dashboard'); // Placeholder
      }
    } catch (err) {
      console.error('Payment processing error:', err);
      setError('Payment processing failed: ' + err.message);
    } finally {
      setConfirming(false);
    }
  };

  useEffect(() => {
    const fetchBookingDetails = async () => {
      try {
        const response = await axios.get(`/api/bookings/${bookingId}`);
        setBooking(response.data);
      } catch (err) {
        console.error('Error fetching booking:', err);
        setError('Failed to load booking details');
      } finally {
        setLoading(false);
      }
    };

    fetchBookingDetails();
  }, [bookingId]);


  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 text-gray-900 py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-300 rounded w-1/3 mb-6"></div>
            <div className="h-64 bg-gray-300 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 text-gray-900 py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
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

  if (!booking) {
    return (
      <div className="min-h-screen bg-gray-50 text-gray-900 py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-2xl font-bold">Booking not found</h2>
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
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Complete Your Payment</h1>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
              <h2 className="text-xl font-bold mb-6">Payment Method</h2>
              
              <div className="space-y-4">
                <div 
                  className={`border-2 rounded-lg p-4 cursor-pointer ${
                    paymentMethod === 'wallet' ? 'border-blue-500 bg-blue-50' : 'border-gray-300'
                  }`}
                  onClick={() => setPaymentMethod('wallet')}
                >
                  <div className="flex items-center">
                    <div className={`w-5 h-5 rounded-full border mr-3 flex items-center justify-center ${
                      paymentMethod === 'wallet' ? 'border-blue-500' : 'border-gray-400'
                    }`}>
                      {paymentMethod === 'wallet' && (
                        <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                      )}
                    </div>
                    <div>
                      <h3 className="font-semibold">Virtual Coins Wallet</h3>
                      <p className="text-gray-600 text-sm">Pay with your available coins</p>
                    </div>
                  </div>
                </div>
                
                <div 
                  className={`border-2 rounded-lg p-4 cursor-pointer ${
                    paymentMethod === 'credit-card' ? 'border-blue-500 bg-blue-50' : 'border-gray-300'
                  }`}
                  onClick={() => setPaymentMethod('credit-card')}
                >
                  <div className="flex items-center">
                    <div className={`w-5 h-5 rounded-full border mr-3 flex items-center justify-center ${
                      paymentMethod === 'credit-card' ? 'border-blue-500' : 'border-gray-400'
                    }`}>
                      {paymentMethod === 'credit-card' && (
                        <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                      )}
                    </div>
                    <div>
                      <h3 className="font-semibold">Credit/Debit Card</h3>
                      <p className="text-gray-600 text-sm">Pay with your credit or debit card</p>
                    </div>
                  </div>
                </div>
                
                <div 
                  className={`border-2 rounded-lg p-4 cursor-pointer ${
                    paymentMethod === 'paypal' ? 'border-blue-500 bg-blue-50' : 'border-gray-300'
                  }`}
                  onClick={() => setPaymentMethod('paypal')}
                >
                  <div className="flex items-center">
                    <div className={`w-5 h-5 rounded-full border mr-3 flex items-center justify-center ${
                      paymentMethod === 'paypal' ? 'border-blue-500' : 'border-gray-400'
                    }`}>
                      {paymentMethod === 'paypal' && (
                        <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                      )}
                    </div>
                    <div>
                      <h3 className="font-semibold">PayPal</h3>
                      <p className="text-gray-600 text-sm">Pay securely with PayPal</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h2 className="text-xl font-bold mb-6">Order Summary</h2>
              
              <div className="space-y-4">
                <div className="flex justify-between">
                  <span>Car Rental ({booking.days} days)</span>
                  <span>{booking.totalPrice} coins</span>
                </div>
                
                <div className="flex justify-between">
                  <span>Tax & Fees</span>
                  <span>+ {(booking.totalPrice * 0.1).toFixed(2)} coins</span>
                </div>
                
                <div className="border-t border-gray-300 pt-4 flex justify-between font-bold text-lg">
                  <span>Total</span>
                  <span>{(booking.totalPrice * 1.1).toFixed(2)} coins</span>
                </div>
              </div>
            </div>
          </div>
          
          <div>
            <div className="bg-white rounded-xl shadow-lg p-6 sticky top-8">
              <h2 className="text-xl font-bold mb-6">Booking Details</h2>
              
              <div className="mb-6">
                <h3 className="font-bold text-lg">{booking.car?.name}</h3>
                <p className="text-gray-600">{booking.car?.brand} • {booking.car?.year}</p>
              </div>
              
              <div className="space-y-4 mb-6">
                <div className="flex justify-between">
                  <span>From</span>
                  <span>{new Date(booking.startDate).toLocaleDateString()}</span>
                </div>
                <div className="flex justify-between">
                  <span>To</span>
                  <span>{new Date(booking.endDate).toLocaleDateString()}</span>
                </div>
                <div className="flex justify-between">
                  <span>Days</span>
                  <span>{booking.days}</span>
                </div>
                <div className="flex justify-between">
                  <span>Rate</span>
                  <span>{booking.car?.coinsRequired} coins/day</span>
                </div>
              </div>
              
              <button
                onClick={handleConfirmPayment}
                disabled={confirming}
                className={`w-full py-3 px-4 rounded-lg font-semibold text-white ${
                  confirming ? 'bg-gray-400' : 'bg-blue-600 hover:bg-blue-700'
                }`}
              >
                {confirming ? 'Processing...' : `Confirm Payment - ${(booking.totalPrice * 1.1).toFixed(2)} coins`}
              </button>
              
              <button
                onClick={() => navigate(-1)}
                className="w-full mt-4 py-3 px-4 rounded-lg font-semibold border border-gray-300 text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentPage;