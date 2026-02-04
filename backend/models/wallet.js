const mongoose = require("mongoose");

const walletSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    unique: true,
    required: true
  },
  balance: {
    type: Number,
    default: 0
  },
  totalCoinsEarned: {
    type: Number,
    default: 0
  },
  level: {
    type: String,
    default: "Beginner"
  },
  badges: [{
    type: String
  }],
  coupons: [{
    code: {
      type: String,
      required: true
    },
    discountPercent: {
      type: Number, // percentage discount (1-100)
      required: true
    },
    expirationDate: {
      type: Date,
      required: true
    },
    used: {
      type: Boolean,
      default: false
    }
  }],
  transactions: [{
    type: {
      type: String,
      enum: ["debit", "credit", "cashback", "purchase", "rental", "coupon_used"],
      required: true
    },
    amount: {
      type: Number,
      required: true
    },
    description: String,
    createdAt: {
      type: Date,
      default: Date.now
    }
  }]
}, { timestamps: true });

module.exports = mongoose.model("Wallet", walletSchema);