import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Minus, Plus } from 'lucide-react';
import './CartDrawer.css';

const CartDrawer = ({ isOpen, onClose, cartItems, onUpdateQuantity, onRemoveItem, onCheckout }) => {
  const [localCartItems, setLocalCartItems] = useState([]);

  useEffect(() => {
    setLocalCartItems(cartItems);
  }, [cartItems]);

  const calculateTotal = () => {
    return localCartItems.reduce((total, item) => {
      return total + (item.car.pricePerDay * item.rentalDuration);
    }, 0);
  };

  const handleUpdateQuantity = (carId, newQuantity) => {
    if (newQuantity < 1) return;
    
    const updatedItems = localCartItems.map(item => {
      if (item.car._id === carId) {
        return { ...item, rentalDuration: newQuantity };
      }
      return item;
    });
    
    setLocalCartItems(updatedItems);
    onUpdateQuantity(carId, newQuantity);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            className="cart-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          
          <motion.div
            className="cart-drawer"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'tween', duration: 0.3 }}
          >
            <div className="cart-header">
              <h2>Your Cart</h2>
              <button className="close-button" onClick={onClose}>
                <X size={24} />
              </button>
            </div>
            
            <div className="cart-items">
              {localCartItems.length === 0 ? (
                <p className="empty-cart">Your cart is empty</p>
              ) : (
                localCartItems.map((item) => (
                  <div key={item.car._id} className="cart-item">
                    <div className="item-image">
                      <img 
                        src={item.car.images[0]} 
                        alt={item.car.name} 
                        onError={(e) => {
                          e.target.style.display = 'none';
                          e.target.nextSibling.style.display = 'flex';
                        }}
                      />
                      <div className="default-image" style={{display: 'none'}}>
                        {item.car.name.charAt(0)}
                      </div>
                    </div>
                    
                    <div className="item-details">
                      <h3>{item.car.name}</h3>
                      <p className="item-price">₹{item.car.pricePerDay}/day</p>
                      
                      <div className="quantity-controls">
                        <button 
                          className="quantity-btn" 
                          onClick={() => handleUpdateQuantity(item.car._id, item.rentalDuration - 1)}
                        >
                          <Minus size={14} />
                        </button>
                        
                        <span className="quantity">{item.rentalDuration} day{item.rentalDuration > 1 ? 's' : ''}</span>
                        
                        <button 
                          className="quantity-btn" 
                          onClick={() => handleUpdateQuantity(item.car._id, item.rentalDuration + 1)}
                        >
                          <Plus size={14} />
                        </button>
                      </div>
                    </div>
                    
                    <div className="item-total">
                      <p>₹{item.car.pricePerDay * item.rentalDuration}</p>
                      <button 
                        className="remove-item"
                        onClick={() => onRemoveItem(item.car._id)}
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
            
            {localCartItems.length > 0 && (
              <div className="cart-footer">
                <div className="total-section">
                  <p>Total:</p>
                  <p className="total-amount">₹{calculateTotal()}</p>
                </div>
                
                <button 
                  className="checkout-button"
                  onClick={onCheckout}
                >
                  Proceed to Checkout
                </button>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default CartDrawer;