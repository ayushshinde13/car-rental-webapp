import React from "react";
import "./Footer.css";

const Footer = () => {
  return (
    <footer className="footer">
      <div className="footer-container">
        <p>
          &copy; 2026 <span>CarRentalApp</span>. All rights reserved.
        </p>
        <p className="footer-sub">
          An industry-ready car rental platform built with the MERN stack, offering secure bookings,
          digital payments, and a virtual coin-based wallet system.
        </p>
      </div>
    </footer>
  );
};

export default Footer;
