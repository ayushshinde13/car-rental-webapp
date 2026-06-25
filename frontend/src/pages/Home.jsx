import React, { useState, useContext } from 'react';
import { Link } from 'react-router-dom';
import { AuthContext } from '../contexts/AuthContext';
import CartDrawer from '../components/CartDrawer';
import './Home.css';

const Home = () => {
  const { user, addToCart, removeFromCart, updateCartItem, cart } = useContext(AuthContext);
  const [showCart, setShowCart] = useState(false);

  const features = [
    {
      title: "Wide Selection",
      description: "Choose from hundreds of cars available in your area.",
      icon: "🚗"
    },
    {
      title: "Easy Booking",
      description: "Book your car in just a few clicks with our simple process.",
      icon: "✅"
    },
    {
      title: "Competitive Prices",
      description: "Get the best deals with our coin-based rental system.",
      icon: "💰"
    },
    {
      title: "Reliable Service",
      description: "Quality cars from trusted providers.",
      icon: "🛡️"
    }
  ];

  const testimonials = [
    {
      name: "John Doe",
      text: "Amazing service! The coin system makes everything so convenient.",
      rating: 5
    },
    {
      name: "Jane Smith",
      text: "Fast and reliable car rental service. Will definitely use again!",
      rating: 4
    }
  ];

  return (
    <div className="home-container">
      {/* Hero Section */}
      <section className="hero">
        <div className="hero-content">
          <h1>Rent Cars with Coin System</h1>
          <p>Earn coins with every rental and enjoy discounts on future bookings!</p>
          
          {user ? (
            user.role === 'renter' ? (
              <div className="hero-actions">
                <Link to="/renter-dashboard" className="btn-primary">Find Your Car</Link>
                <Link to="/cart" className="btn-secondary">View Cart</Link>
              </div>
            ) : user.role === 'provider' ? (
              <div className="hero-actions">
                <Link to="/provider-dashboard" className="btn-primary">My Dashboard</Link>
                <Link to="/addcar" className="btn-secondary">Add Car</Link>
              </div>
            ) : (
              <Link to="/login" className="btn-primary">Browse Cars</Link>
            )
          ) : (
            <div className="hero-actions">
              <Link to="/register" className="btn-primary">Get Started</Link>
              <Link to="/login" className="btn-secondary">Log In</Link>
            </div>
          )}
        </div>
      </section>

      {/* Features Section */}
      <section className="features">
        <div className="container">
          <h2>Why Choose Us</h2>
          <div className="features-grid">
            {features.map((feature, index) => (
              <div key={index} className="feature-card">
                <div className="feature-icon">{feature.icon}</div>
                <h3>{feature.title}</h3>
                <p>{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="testimonials">
        <div className="container">
          <h2>What Our Customers Say</h2>
          <div className="testimonials-grid">
            {testimonials.map((testimonial, index) => (
              <div key={index} className="testimonial-card">
                <div className="rating">
                  {'★'.repeat(testimonial.rating)}{'☆'.repeat(5 - testimonial.rating)}
                </div>
                <p>"{testimonial.text}"</p>
                <h4>- {testimonial.name}</h4>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="cta">
        <div className="container">
          <h2>Ready to Rent a Car?</h2>
          <p>Join thousands of satisfied customers who enjoy our coin-based discount system</p>
        </div>
      </section>

      {/* Cart Drawer */}
      {showCart && (
        <CartDrawer 
          isOpen={showCart} 
          onClose={() => setShowCart(false)} 
          cartItems={cart}
          removeFromCart={removeFromCart}
          updateCartItem={updateCartItem}
        />
      )}
    </div>
  );
};

export default Home;
