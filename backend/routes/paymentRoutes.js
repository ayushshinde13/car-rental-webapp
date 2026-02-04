const express = require("express");
const router = express.Router();
const auth = require("../middleware/authmiddleware"); // ✅ Using the correct auth middleware

// Initialize Stripe with error handling
let stripe;
try {
  if (!process.env.STRIPE_SECRET_KEY) {
    console.warn("⚠️ Stripe secret key not found in environment variables.");
    console.warn("⚠️ Payments will not work until you add STRIPE_SECRET_KEY to your .env file.");
  } else {
    stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
  }
} catch (error) {
  console.error("❌ Error initializing Stripe:", error.message);
  console.warn("⚠️ Stripe is disabled. Please install the stripe package: npm install stripe");
}

const Payment = require("../models/payment");
const Booking = require("../models/booking");

// CREATE PAYMENT INTENT
router.post("/create-payment-intent", auth, async (req, res) => {
  try {
    const { bookingId, useCoins } = req.body;

    // Check if Stripe is properly configured
    if (!stripe) {
      return res.status(500).json({ 
        message: "Payment processing is currently unavailable. Please contact support." 
      });
    }

    // Find the booking
    const booking = await Booking.findById(bookingId).populate('car');
    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    // Verify that the user owns this booking
    if (booking.user.toString() !== req.user.id) {
      return res.status(403).json({ message: "Access denied" });
    }

    // Calculate final amount based on coins
    let finalAmount = booking.totalPrice;
    
    // If user wants to use coins, we'll need to integrate with coin system
    if (useCoins) {
      // This would typically come from a coin service or user model
      const userCoins = req.user.coins || 0; // Example from user model
      
      // Convert coins to USD value (example: 100 coins = $1)
      const coinValue = userCoins / 100;
      
      // Calculate how much we can deduct using coins
      const amountFromCoins = Math.min(coinValue, finalAmount);
      
      // Update final amount that needs to be paid via stripe
      finalAmount -= amountFromCoins;
      
      // Create a payment record for the coin portion
      if (amountFromCoins > 0) {
        const coinPayment = new Payment({
          user: req.user.id,
          booking: bookingId,
          paymentProvider: "coins",
          amount: amountFromCoins,
          currency: "USD",
          status: "success",
          coinAmount: userCoins // Track how many coins were used
        });
        
        await coinPayment.save();
        
        // Deduct coins from user account (this would be in a service)
        req.user.coins = Math.max(0, userCoins - Math.floor(amountFromCoins * 100));
        await req.user.save();
      }
    }

    // Create a PaymentIntent only if there's remaining amount to pay
    if (finalAmount > 0) {
      const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(finalAmount * 100), // Convert to cents/paise
        currency: "usd",
        metadata: {
          bookingId: bookingId,
          userId: req.user.id,
        },
      });

      // Create a payment record for the stripe portion
      const stripePayment = new Payment({
        user: req.user.id,
        booking: bookingId,
        paymentProvider: "stripe",
        paymentId: paymentIntent.id,
        amount: finalAmount,
        currency: "USD",
        status: "pending"
      });

      await stripePayment.save();

      res.json({
        clientSecret: paymentIntent.client_secret,
        paymentType: "mixed", // Indicates a combination of coin and stripe payments
      });
    } else {
      // If fully paid with coins
      res.json({
        clientSecret: null,
        paymentType: "coins_only",
        message: "Payment fully covered by coins"
      });
    }
  } catch (error) {
    console.error("CREATE PAYMENT INTENT ERROR:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// HANDLE PAYMENT SUCCESS WEBHOOK (for Stripe)
router.post("/webhook", express.raw({ type: "application/json" }), async (req, res) => {
  // Check if Stripe is properly configured
  if (!stripe) {
    return res.status(500).json({ 
      message: "Stripe is not configured. Webhooks cannot be processed." 
    });
  }

  const sig = req.headers["stripe-signature"];
  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error("Webhook signature verification failed:", err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Handle the event
  if (event.type === "payment_intent.succeeded") {
    const paymentIntent = event.data.object;
    
    // Update the payment status
    await Payment.findOneAndUpdate(
      { paymentId: paymentIntent.id },
      { 
        status: "success",
        paymentIntentId: paymentIntent.id
      }
    );

    // Update the booking payment status
    const payment = await Payment.findOne({ paymentId: paymentIntent.id });
    if (payment) {
      await Booking.findByIdAndUpdate(
        payment.booking,
        { paymentStatus: "paid" }
      );
    }
  } else if (event.type === "payment_intent.payment_failed") {
    const paymentIntent = event.data.object;
    
    // Update the payment status
    await Payment.findOneAndUpdate(
      { paymentId: paymentIntent.id },
      { 
        status: "failed",
        paymentIntentId: paymentIntent.id
      }
    );
  }

  res.json({ received: true });
});

// GET USER PAYMENTS
router.get("/my-payments", auth, async (req, res) => {
  try {
    const payments = await Payment.find({ user: req.user.id })
      .populate('booking', 'startDate endDate totalPrice bookingStatus')
      .sort({ createdAt: -1 });

    res.json(payments);
  } catch (error) {
    console.error("GET USER PAYMENTS ERROR:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// GET PAYMENT DETAILS
router.get("/:id", auth, async (req, res) => {
  try {
    const payment = await Payment.findById(req.params.id)
      .populate('booking', 'startDate endDate totalPrice bookingStatus')
      .populate('user', 'name email coins'); // Added coins field

    if (!payment) {
      return res.status(404).json({ message: "Payment not found" });
    }

    // Only allow the payment owner or admin to view the payment
    if (payment.user._id.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ message: "Access denied" });
    }

    res.json(payment);
  } catch (error) {
    console.error("GET PAYMENT DETAILS ERROR:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// CHECK COIN BALANCE
router.get("/coin-balance", auth, async (req, res) => {
  try {
    // Return the user's coin balance
    res.json({
      coins: req.user.coins || 0,
      coinValue: (req.user.coins / 100) || 0 // Show coin value in USD
    });
  } catch (error) {
    console.error("GET COIN BALANCE ERROR:", error);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;