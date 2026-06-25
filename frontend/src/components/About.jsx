import React from "react";
import "./About.css"; // import CSS file

const About = () => {
  return (
    <section className="about-section">
      {/* Section Heading */}
      <h2 className="about-title">About Us</h2>
      <div className="about-underline"></div>

      {/* Intro Paragraph */}
      <p className="about-text">
        At <span className="highlight">Car Rental App</span>, our mission is to make renting a car 
        <span className="highlight"> simple, fast, and convenient</span>. 
        Whether you need a car for a day, a week, or longer, we provide a wide range of vehicles to suit your needs.
      </p>

      {/* Our Vision */}
      <p className="about-text">
        Our vision is to provide a seamless car rental experience with 
        <span className="highlight"> affordable rates, flexible bookings, and exceptional customer service</span>. 
        We aim to make your journey enjoyable from start to finish.
      </p>

      {/* Why Choose Us */}
      <div className="about-cards">
        <div className="about-card">
          <h3>🚘 Affordable Pricing</h3>
          <p>We offer competitive rates for all types of cars, so you get the best deal every time.</p>
        </div>

        <div className="about-card">
          <h3>🚗 Wide Selection</h3>
          <p>From sedans to SUVs and luxury cars, choose the perfect vehicle for your trip.</p>
        </div>

        <div className="about-card">
          <h3>💬 24/7 Support</h3>
          <p>Our team is available around the clock to assist you with bookings and inquiries.</p>
        </div>
      </div>
    </section>
  );
};

export default About;
