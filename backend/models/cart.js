// backend/models/cart.js

const mongoose = require("mongoose");

const cartItemSchema = new mongoose.Schema({
  car: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Car",
    required: true,
  },
  rentalDuration: {
    type: Number, // in days
    required: true,
    default: 1,
    min: 1,
  },
  dateAdded: {
    type: Date,
    default: Date.now,
  },
}, { timestamps: true });

const cartSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  items: [cartItemSchema],
}, { timestamps: true });

module.exports = mongoose.model("Cart", cartSchema);