const mongoose = require("mongoose");

const bookingSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  car: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Car",
    required: true
  },
  startDate: {
    type: Date,
    required: true
  },
  endDate: {
    type: Date,
    required: true
  },
  totalPrice: {
    type: Number,
    required: true
  },
  coinsPaid: {
    type: Number,
    required: true
  },
  cashbackCoins: {
    type: Number,
    default: 0
  },
  paymentStatus: {
    type: String,
    enum: ["pending", "paid", "failed"],
    default: "pending"
  },
  bookingStatus: {
    type: String,
    enum: ["active", "cancelled", "completed"],
    default: "active"
  }
}, { timestamps: true });

module.exports = mongoose.model("Booking", bookingSchema);