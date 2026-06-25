import React from "react";
import "./Help.css";

const Help = () => {
  return (
    <section className="help-section">
      {/* Section Heading */}
      <h2>Need Help?</h2>
      <p>
        We’re here to make your car rental experience smooth and easy. Check out our FAQs or contact our support team.
      </p>

      {/* FAQ / Help Cards */}
      <div className="help-grid">
        <div className="help-card">
          <h3>How do I book a car?</h3>
          <p>
            Simply browse our available cars, select your preferred vehicle, choose your dates, and confirm your booking online.
          </p>
        </div>
        <div className="help-card">
          <h3>Can I cancel or change my booking?</h3>
          <p>
            Yes! You can cancel or modify your reservation easily through your account before the rental date. Some conditions may apply.
          </p>
        </div>
        <div className="help-card">
          <h3>What if I face a problem during my rental?</h3>
          <p>
            Our 24/7 customer support team is available to assist you anytime. You can call, email, or chat with us for immediate help.
          </p>
        </div>
      </div>

      {/* Contact CTA */}
      <div className="help-cta">
        <p>Still have questions? Reach out to our support team directly.</p>
        <a href="/contact">Contact Support</a>
      </div>
    </section>
  );
};

export default Help;
