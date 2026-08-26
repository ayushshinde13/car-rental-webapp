const express = require('express');
const router = express.Router();
const auth = require('../middleware/authmiddleware');
const Booking = require('../models/booking');

// GET TOTAL REVENUE (Admin only)
router.get('/revenue', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: "Access denied" });
    }

    const bookings = await Booking.find({ bookingStatus: { $ne: 'cancelled' } });
    const total = bookings.reduce((sum, b) => sum + (b.coinsPaid || 0), 0);
    
    res.json({ total });
  } catch (err) {
    console.error("GET REVENUE ERROR:", err);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
