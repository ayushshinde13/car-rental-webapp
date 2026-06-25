import React from 'react';
import './BrandCarousel.css';

const BrandCarousel = () => {
  const brands = [
    { name: "Toyota", logo: "🚗" },
    { name: "Honda", logo: "🚙" },
    { name: "Ford", logo: "🚘" },
    { name: "BMW", logo: "🏎️" },
    { name: "Mercedes", logo: "🚚" },
    { name: "Audi", logo: "🚛" },
    { name: "Nissan", logo: "tractor" },
    { name: "Hyundai", logo: "🚲" },
    { name: "Kia", logo: "🛵" },
    { name: "Volkswagen", logo: "🏍️" },
  ];

  return (
    <div className="carousel-container">
      <h2>Popular Brands</h2>
      <div className="carousel-track">
        {[...brands, ...brands].map((brand, index) => (
          <div key={`${brand.name}-${index}`} className="brand-item">
            <span className="brand-logo">{brand.logo}</span>
            <span className="brand-name">{brand.name}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default BrandCarousel;