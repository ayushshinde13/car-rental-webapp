const mongoose = require("mongoose");

const feedbackSchema = new mongoose.Schema({
  renter: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "User", 
    required: true 
  },
  owner: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "User", 
    required: true 
  },
  car: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "Car", 
    required: true 
  },
  booking: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Booking",
    required: true
  },
  rating: { 
    type: Number, 
    min: 1, 
    max: 5,
    required: true
  },
  comment: String
}, { timestamps: true });

module.exports = mongoose.model("Feedback", feedbackSchema);