const express = require("express");
const router = express.Router();
const auth = require("../middleware/authmiddleware");
const Feedback = require("../models/feedback");
const Booking = require("../models/booking");
const Car = require("../models/car");
const Wallet = require("../models/wallet");

// POST FEEDBACK FOR A BOOKING
router.post("/", auth, async (req, res) => {
  try {
    const { bookingId, rating, comment } = req.body;

    // Verify booking exists and belongs to the user
    const booking = await Booking.findById(bookingId).populate('car');
    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    // Ensure the feedback is coming from the renter who made the booking
    if (booking.user.toString() !== req.user.id) {
      return res.status(403).json({ message: "Not authorized to provide feedback for this booking" });
    }

    // Verify booking is completed
    if (booking.bookingStatus !== "completed") {
      return res.status(400).json({ message: "Cannot provide feedback for incomplete booking" });
    }

    // Check if feedback already exists for this booking
    const existingFeedback = await Feedback.findOne({ booking: bookingId });
    if (existingFeedback) {
      return res.status(400).json({ message: "Feedback already provided for this booking" });
    }

    // Create feedback
    const feedback = new Feedback({
      renter: req.user.id,
      owner: booking.car.provider,
      car: booking.car._id,
      booking: bookingId,
      rating,
      comment
    });

    await feedback.save();

    res.status(201).json({ 
      message: "Feedback submitted successfully", 
      feedback 
    });
  } catch (error) {
    console.error("POST FEEDBACK ERROR:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// GET FEEDBACK FOR A CAR
router.get("/car/:carId", auth, async (req, res) => {
  try {
    const { carId } = req.params;

    const feedbacks = await Feedback.find({ car: carId })
      .populate('renter', 'name')
      .populate('owner', 'name')
      .sort({ createdAt: -1 });

    // Calculate average rating
    const avgRating = feedbacks.length > 0 
      ? feedbacks.reduce((sum, f) => sum + f.rating, 0) / feedbacks.length 
      : 0;

    res.json({
      feedbacks,
      averageRating: parseFloat(avgRating.toFixed(2)),
      totalReviews: feedbacks.length
    });
  } catch (error) {
    console.error("GET CAR FEEDBACK ERROR:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// GET FEEDBACK FOR A USER (OWNER)
router.get("/user/:userId", auth, async (req, res) => {
  try {
    const { userId } = req.params;

    const feedbacks = await Feedback.find({ owner: userId })
      .populate('renter', 'name')
      .populate('car', 'name brand')
      .populate('booking', 'startDate endDate')
      .sort({ createdAt: -1 });

    // Calculate average rating
    const avgRating = feedbacks.length > 0 
      ? feedbacks.reduce((sum, f) => sum + f.rating, 0) / feedbacks.length 
      : 0;

    res.json({
      feedbacks,
      averageRating: parseFloat(avgRating.toFixed(2)),
      totalReviews: feedbacks.length
    });
  } catch (error) {
    console.error("GET USER FEEDBACK ERROR:", error);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;