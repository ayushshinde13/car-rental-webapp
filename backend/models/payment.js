const mongoose = require("mongoose");

const paymentSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  booking: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Booking",
    required: true
  },
  paymentProvider: {
    type: String,
    enum: ["stripe", "razorpay"],
    required: true
  },
  paymentId: String,
  amount: Number,
  currency: {
    type: String,
    default: "INR"
  },
  status: {
    type: String,
    enum: ["success", "failed", "pending"],
    default: "pending"
  }
}, { timestamps: true });

module.exports = mongoose.model("Payment", paymentSchema);