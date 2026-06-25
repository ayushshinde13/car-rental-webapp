const mongoose = require("mongoose");

const carSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  brand: {
    type: String,
    required: true,
    trim: true,
  },
  model: {
    type: String,
    required: true,
    trim: true,
  },
  year: {
    type: Number,
    required: true,
  },
  pricePerDay: {
    type: Number,
    required: true,
    min: 0,
  },
  fuelType: {
    type: String,
    required: true,
    enum: ["Petrol", "Diesel", "Electric", "Hybrid"],
  },
  transmission: {
    type: String,
    required: true,
    enum: ["Manual", "Automatic"],
  },
  images: [
    {
      type: String, // Array of image URLs
      required: true,
      validate: {
        validator: function(images) {
          return images.length >= 1;
        },
        message: 'A car must have at least 1 image'
      }
    }
  ],
  provider: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  available: {
    type: Boolean,
    default: true,
  },
  rating: {
    average: {
      type: Number,
      default: 0,
      min: 0,
      max: 5,
    },
    count: {
      type: Number,
      default: 0,
    }
  }
}, { timestamps: true });

// Pre-save validation to ensure minimum 4 images
carSchema.pre('validate', function(next) {
  if (this.images && this.images.length < 1) {
    this.invalidate('images', 'A car must have at least 1 image');
  }
  next();
});

module.exports = mongoose.model("Car", carSchema);
