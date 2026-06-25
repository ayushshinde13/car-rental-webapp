import React, { useState } from 'react';
import './CarImageSwiper.css';

const CarImageSwiper = ({ images = [] }) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  const goToPrevious = () => {
    setCurrentIndex((prevIndex) =>
      prevIndex === 0 ? images.length - 1 : prevIndex - 1
    );
  };

  const goToNext = () => {
    setCurrentIndex((prevIndex) =>
      prevIndex === images.length - 1 ? 0 : prevIndex + 1
    );
  };

  if (!images || images.length === 0) {
    return <div className="no-images">No images available</div>;
  }

  return (
    <div className="swiper-container">
      <div className="image-container">
        <img 
          src={images[currentIndex]} 
          alt={`View of the car from angle ${currentIndex + 1}`} 
          className="current-image"
        />
      </div>
      
      <div className="navigation-buttons">
        <button onClick={goToPrevious} className="nav-button prev">
          &#8249;
        </button>
        <button onClick={goToNext} className="nav-button next">
          &#8250;
        </button>
      </div>
      
      <div className="indicators">
        {images.map((_, index) => (
          <span
            key={index}
            onClick={() => setCurrentIndex(index)}
            className={`indicator ${index === currentIndex ? 'active' : ''}`}
          />
        ))}
      </div>
    </div>
  );
};

export default CarImageSwiper;