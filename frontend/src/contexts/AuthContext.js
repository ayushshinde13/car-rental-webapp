import React, { createContext, useState, useEffect } from 'react';
import axios from '../utils/axios';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [cart, setCart] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null); // Add error state

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      // Verify token and get user data
      const fetchUserData = async () => {
        try {
          const userRes = await axios.get('/api/auth/me');
          setUser(userRes.data.user);
          
          // Fetch user's cart if they are a renter
          if (userRes.data.user.role === 'renter') {
            const cartRes = await axios.get('/api/users/cart');
            setCart(cartRes.data.items || []);
          }
        } catch (error) {
          console.error('Auth Context Error:', error);
          localStorage.removeItem('token');
        } finally {
          setLoading(false);
        }
      };
      
      fetchUserData();
    } else {
      setLoading(false);
    }
  }, []);

  const refreshUserData = async () => {
    try {
      const userRes = await axios.get('/api/auth/me');
      const userData = userRes.data.user;  // Used in the return statement below
      setUser(userData);
      
      // Fetch cart if user is a renter
      if (userData.role === 'renter') {
        const cartRes = await axios.get('/api/users/cart');
        setCart(cartRes.data.items || []);
      }
      
      return userData;
    } catch (error) {
      console.error('Failed to refresh user data:', error);
      throw error;
    }
  };

  const login = async (email, password) => {
    try {
      const res = await axios.post('/api/auth/login', { email, password });
      const { token } = res.data;
      
      localStorage.setItem('token', token);
      
      // Set up axios defaults
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      
      // Get fresh user data
      const userData = await refreshUserData();
      
      return { success: true, user: userData };
    } catch (error) {
      return { 
        success: false, 
        message: error.response?.data?.message || 'Login failed' 
      };
    }
  };

  const register = async (name, email, password, role) => {
    try {
      const res = await axios.post('/api/auth/register', { 
        name, 
        email, 
        password, 
        role 
      });
      
      const { token } = res.data;
      
      localStorage.setItem('token', token);
      
      // Set up axios defaults
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      
      // Get fresh user data
      const userData = await refreshUserData();
      
      return { success: true, user: userData };
    } catch (error) {
      return { 
        success: false, 
        message: error.response?.data?.message || 'Registration failed' 
      };
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    delete axios.defaults.headers.common['Authorization'];
    setUser(null);
    setCart(null);
  };

  const addToCart = async (carId, duration = 1) => {
    try {
      const res = await axios.post('/api/users/cart', { 
        carId, 
        rentalDuration: duration 
      });
      
      setCart(res.data.items || []);
      return res.data.items || [];
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to add to cart');
    }
  };

  const removeFromCart = async (carId) => {
    try {
      const res = await axios.delete(`/api/users/cart/${carId}`);
      
      setCart(res.data.items || []);
      return res.data.items || [];
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to remove from cart');
    }
  };

  const updateCartItem = async (carId, duration) => {
    try {
      const res = await axios.patch(`/api/users/cart/${carId}`, { 
        rentalDuration: duration 
      });
      
      setCart(res.data.items || []);
      return res.data.items || [];
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to update cart item');
    }
  };

  if (loading) {
    return <div>Loading user data...</div>; // Localized to English
  }

  // Add error handling component
  if (error) {
    return (
      <div style={{ color: 'red', padding: '1rem' }}>
        {error}
        <button onClick={() => setError(null)} style={{ marginLeft: '1rem' }}>
          Retry
        </button>
      </div>
    );
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        cart,
        login,
        register,
        logout,
        addToCart,
        removeFromCart,
        updateCartItem
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};