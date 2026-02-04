const mongoose = require("mongoose");

const carSchema = new mongoose.Schema({
  name: { type: String, required: true },
  brand: { type: String, required: true },
  year: { type: Number, required: true },
  pricePerDay: { type: Number, required: true },
  imageUrl: { type: String },
  owner: { type: mongoose.Schema.Types.ObjectId, ref: "User" }, // provider
}, { timestamps: true });

module.exports = mongoose.model("Car", carSchema);
