import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from '../utils/axios';
import { AuthContext } from '../contexts/AuthContext';
import './AddCarForm.css';

const AddCar = () => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    name: '',
    brand: '',
    model: '',
    year: '',
    pricePerDay: '',
    fuelType: 'Petrol',
    transmission: 'Manual',
    images: []
  });
  
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  if (!user || user.role !== 'provider') {
    return (
      <div className="access-denied">
        <h2>Access Denied</h2>
        <p>Only providers can add cars.</p>
      </div>
    );
  }

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleImageUpload = async (e) => {
    const files = Array.from(e.target.files);
    setLoading(true);
    setMessage('');
    
    const uploadPromises = files.map(file => {
      const formData = new FormData();
      formData.append('image', file);
      
      return axios.post('/api/upload', formData).then(res => res.data);
    });

    try {
      const results = await Promise.all(uploadPromises);
      const imageUrls = results.map(r => r.imageUrl);
      setFormData(prev => ({
        ...prev,
        images: [...prev.images, ...imageUrls]
      }));
    } catch (err) {
      setMessage('Error uploading images');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      if (!formData.images || formData.images.length < 1) {
        setMessage('Please upload at least 1 image.');
        setLoading(false);
        return;
      }

      await axios.post('/api/cars', formData);
      setMessage('Car added successfully!');
        setFormData({
          name: '',
          brand: '',
          model: '',
          year: '',
          pricePerDay: '',
          fuelType: 'Petrol',
          transmission: 'Manual',
          images: []
        });
        setTimeout(() => navigate('/provider-dashboard'), 800);
    } catch (err) {
      setMessage(err.response?.data?.message || err.response?.data?.msg || 'Network error. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="add-car-form-container">
      <h2>Add New Car</h2>
      
      {message && (
        <div className={message.includes('successfully') ? 'success-message' : 'error-message'}>
          {message}
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="add-car-form">
        <div className="form-group">
          <label htmlFor="name">Car Name *</label>
          <input
            type="text"
            id="name"
            name="name"
            value={formData.name}
            onChange={handleInputChange}
            required
          />
        </div>
        
        <div className="form-row">
          <div className="form-group">
            <label htmlFor="brand">Brand *</label>
            <input
              type="text"
              id="brand"
              name="brand"
              value={formData.brand}
              onChange={handleInputChange}
              required
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="model">Model *</label>
            <input
              type="text"
              id="model"
              name="model"
              value={formData.model}
              onChange={handleInputChange}
              required
            />
          </div>
        </div>
        
        <div className="form-row">
          <div className="form-group">
            <label htmlFor="year">Year *</label>
            <input
              type="number"
              id="year"
              name="year"
              min="1990"
              max="2030"
              value={formData.year}
              onChange={handleInputChange}
              required
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="pricePerDay">Price Per Day (₹)*</label>
            <input
              type="number"
              id="pricePerDay"
              name="pricePerDay"
              min="0"
              value={formData.pricePerDay}
              onChange={handleInputChange}
              required
            />
          </div>
        </div>
        
        <div className="form-row">
          <div className="form-group">
            <label htmlFor="fuelType">Fuel Type *</label>
            <select
              id="fuelType"
              name="fuelType"
              value={formData.fuelType}
              onChange={handleInputChange}
            >
              <option value="Petrol">Petrol</option>
              <option value="Diesel">Diesel</option>
              <option value="Electric">Electric</option>
              <option value="Hybrid">Hybrid</option>
            </select>
          </div>
          
          <div className="form-group">
            <label htmlFor="transmission">Transmission *</label>
            <select
              id="transmission"
              name="transmission"
              value={formData.transmission}
              onChange={handleInputChange}
            >
              <option value="Manual">Manual</option>
              <option value="Automatic">Automatic</option>
            </select>
          </div>
        </div>
        
        <div className="form-group">
          <label>Images</label>
          <input
            type="file"
            multiple
            accept="image/*"
            onChange={handleImageUpload}
            disabled={loading}
          />
          <div className="image-preview">
            {formData.images.map((img, idx) => (
              <img key={idx} src={img} alt={`Preview ${idx}`} />
            ))}
          </div>
        </div>
        
        <button type="submit" disabled={loading} className="submit-btn">
          {loading ? 'Adding Car...' : 'Add Car'}
        </button>
      </form>
    </div>
  );
};

export default AddCar;
