const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const auth = require("../middleware/authmiddleware"); // ✅ Using the correct auth middleware
const { body, validationResult } = require("express-validator");

const Booking = require("../models/booking");
const Car = require("../models/car");
const Wallet = require("../models/wallet");
const Feedback = require("../models/feedback");

// Level rules for calculating cashback
const levelRules = [
  { level: "Beginner", minCoins: 0, cashback: 5 },
  { level: "Explorer", minCoins: 100, cashback: 7 },
  { level: "Pro Renter", minCoins: 300, cashback: 10 },
  { level: "Elite", minCoins: 700, cashback: 15 },
  { level: "Legend", minCoins: 1500, cashback: 20 }
];

// Helper function to get cashback based on user level
const getCashbackByLevel = (userLevel) => {
  const level = levelRules.find(l => l.level === userLevel) || levelRules[0];
  return level.cashback;
};

// Validation middleware for booking input
const validateBookingInput = [
  body("carId")
    .isMongoId()
    .withMessage("Valid car ID is required"),
  body("startDate")
    .isISO8601()
    .withMessage("Valid start date is required (YYYY-MM-DD)"),
  body("endDate")
    .isISO8601()
    .withMessage("Valid end date is required (YYYY-MM-DD)")
    .custom((value, { req }) => {
      if (new Date(value) <= new Date(req.body.startDate)) {
        throw new Error("End date must be after start date");
      }
      return true;
    }),
];

// CREATE BOOKING WITH COIN PAYMENT AND COUPON DISCOUNT
router.post("/", auth, validateBookingInput, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: "Validation failed", errors: errors.array() });
    }

    const { carId, startDate, endDate, couponCode } = req.body;

    // Check if car exists and is available
    const car = await Car.findById(carId).populate('provider');
    if (!car) {
      return res.status(404).json({ message: "Car not found" });
    }

    // Prevent self-booking (anti-fraud measure)
    if (car.provider._id.toString() === req.user.id) {
      return res.status(400).json({ message: "Cannot book your own car" });
    }

    // Check for existing bookings that overlap with the requested dates
    const existingBooking = await Booking.findOne({
      car: carId,
      bookingStatus: { $ne: "cancelled" }, // Only consider active/non-cancelled bookings
      $and: [
        { startDate: { $lt: new Date(endDate) } },
        { endDate: { $gt: new Date(startDate) } }
      ]
    });

    if (existingBooking) {
      return res.status(409).json({ 
        message: "Car is not available for the selected dates. It's already booked during this period." 
      });
    }

    // Calculate total price and coins required
    const start = new Date(startDate);
    const end = new Date(endDate);
    const days = Math.ceil((end - start) / (1000 * 60 * 60 * 24)); // Difference in days
    const totalPrice = days * car.pricePerDay;
    let coinsRequired = car.pricePerDay * days;

    // Check if a coupon code was provided and apply discount
    let couponApplied = null;
    let discountAmount = 0;
    
    if (couponCode) {
      const userWallet = await Wallet.findOne({ user: req.user.id });
      if (!userWallet) {
        return res.status(400).json({ message: "User wallet not found" });
      }
      
      const coupon = userWallet.coupons.find(c => 
        c.code === couponCode && 
        !c.used && 
        new Date(c.expirationDate) > new Date()
      );
      
      if (!coupon) {
        return res.status(400).json({ message: "Invalid or expired coupon code" });
      }
      
      // Apply discount
      discountAmount = Math.floor(coinsRequired * (coupon.discountPercent / 100));
      coinsRequired = coinsRequired - discountAmount;
      
      // Mark coupon as used
      coupon.used = true;
      couponApplied = coupon;
      
      await userWallet.save();
    }

    // Check if user has enough coins in wallet
    let userWallet = await Wallet.findOne({ user: req.user.id });
    if (!userWallet || userWallet.balance < coinsRequired) {
      return res.status(400).json({ 
        message: `Insufficient coins. You need ${coinsRequired} coins but have ${userWallet ? userWallet.balance : 0} coins.` 
      });
    }

    const executeOperations = async (sessionOption) => {
      // Deduct coins from renter's wallet
      userWallet.balance -= coinsRequired;
      userWallet.transactions.push({
        type: "rental",
        amount: coinsRequired,
        description: `Rented car: ${car.name} for ${days} days` + 
          (discountAmount > 0 ? ` with ${discountAmount} coin discount from coupon ${couponApplied.code}` : '')
      });
      await userWallet.save(sessionOption);

      // Credit coins to owner's wallet
      let ownerWallet = await Wallet.findOne({ user: car.provider._id });
      if (!ownerWallet) {
        ownerWallet = new Wallet({
          user: car.provider._id,
          balance: coinsRequired,
          totalCoinsEarned: coinsRequired,
          level: "Beginner",
          badges: [],
          coupons: []
        });
      } else {
        ownerWallet.balance += coinsRequired;
        ownerWallet.totalCoinsEarned += coinsRequired;
      }
      
      ownerWallet.transactions.push({
        type: "credit",
        amount: coinsRequired,
        description: `Received payment for car rental: ${car.name}`
      });
      
      const currentLevelRules = [
        { level: "Beginner", minCoins: 0 },
        { level: "Explorer", minCoins: 100 },
        { level: "Pro Renter", minCoins: 300 },
        { level: "Elite", minCoins: 700 },
        { level: "Legend", minCoins: 1500 }
      ];
      
      const getLevelByCoins = (totalCoinsEarned) => {
        const sortedLevels = [...currentLevelRules].sort((a, b) => b.minCoins - a.minCoins);
        for (const levelRule of sortedLevels) {
          if (totalCoinsEarned >= levelRule.minCoins) {
            return levelRule.level;
          }
        }
        return "Beginner";
      };
      
      ownerWallet.level = getLevelByCoins(ownerWallet.totalCoinsEarned);
      await ownerWallet.save(sessionOption);

      // Create new booking
      const booking = new Booking({
        user: req.user.id,
        car: carId,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        totalPrice,
        coinsPaid: coinsRequired,
        cashbackCoins: 0
      });

      const savedBooking = await booking.save(sessionOption);
      return savedBooking;
    };

    let savedBooking;
    let session = null;

    try {
      session = await mongoose.startSession();
      session.startTransaction();
      savedBooking = await executeOperations({ session });
      await session.commitTransaction();
    } catch (transactionError) {
      if (session) {
        try {
          await session.abortTransaction();
        } catch (abortError) {
          // Ignore
        }
      }
      
      const isReplicaSetError = 
        transactionError.code === 20 || 
        (transactionError.message && (
          transactionError.message.includes("replica set") || 
          transactionError.message.includes("Transaction numbers")
        ));
        
      if (isReplicaSetError) {
        console.warn("MongoDB standalone detected. Falling back to non-transactional operations.");
        // Reload userWallet since the memory instance might be in an inconsistent state
        userWallet = await Wallet.findOne({ user: req.user.id });
        if (!userWallet || userWallet.balance < coinsRequired) {
          return res.status(400).json({ 
            message: `Insufficient coins. You need ${coinsRequired} coins but have ${userWallet ? userWallet.balance : 0} coins.` 
          });
        }
        savedBooking = await executeOperations({});
      } else {
        throw transactionError;
      }
    } finally {
      if (session) {
        try {
          await session.endSession();
        } catch (endError) {
          // Ignore
        }
      }
    }

    // Populate the booking with user and car details
    const populatedBooking = await Booking.findById(savedBooking._id)
      .populate('user', 'name email')
      .populate({
        path: 'car',
        select: 'name brand year pricePerDay images provider',
        populate: {
          path: 'provider',
          select: 'name email'
        }
      });

    res.status(201).json({ 
      message: "Booking created successfully", 
      booking: populatedBooking 
    });
  } catch (error) {
    console.error("CREATE BOOKING ERROR:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// GET USER'S BOOKINGS
router.get("/mybookings", auth, async (req, res) => {
  try {
    const bookings = await Booking.find({ user: req.user.id })
      .populate('car', 'name brand year pricePerDay images')
      .populate('user', 'name email')
      .sort({ createdAt: -1 }); // Sort by newest first

    res.json(bookings);
  } catch (error) {
    console.error("GET USER BOOKINGS ERROR:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// GET ALL BOOKINGS (Admin only)
router.get("/", auth, async (req, res) => {
  try {
    // Only allow admin users to fetch all bookings
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: "Access denied. Admin role required." });
    }

    const bookings = await Booking.find()
      .populate('user', 'name email')
      .populate({
        path: 'car',
        select: 'name brand year pricePerDay images provider',
        populate: {
          path: 'provider',
          select: 'name email'
        }
      })
      .sort({ createdAt: -1 });

    res.json(bookings);
  } catch (error) {
    console.error("GET ALL BOOKINGS ERROR:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// GET SINGLE BOOKING
router.get("/:id", auth, async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id)
      .populate('user', 'name email')
      .populate({
        path: 'car',
        select: 'name brand year pricePerDay images provider',
        populate: {
          path: 'provider',
          select: 'name email'
        }
      });

    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    // Only allow the booking user, car provider, or admin to view the booking
    const car = await Car.findById(booking.car);
    if (
      booking.user.toString() !== req.user.id &&
      car.provider.toString() !== req.user.id &&
      req.user.role !== 'admin'
    ) {
      return res.status(403).json({ message: "Access denied" });
    }

    res.json(booking);
  } catch (error) {
    console.error("GET BOOKING ERROR:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// UPDATE BOOKING STATUS (Admin/Car Owner only)
router.put("/:id", auth, async (req, res) => {
  try {
    const { bookingStatus, paymentStatus } = req.body;

    const booking = await Booking.findById(req.params.id);
    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    // Only allow car provider or admin to update booking
    const car = await Car.findById(booking.car);
    if (
      car.provider.toString() !== req.user.id &&
      req.user.role !== 'admin'
    ) {
      return res.status(403).json({ message: "Access denied" });
    }

    // Update allowed fields
    if (bookingStatus) {
      if (!['active', 'cancelled', 'completed'].includes(bookingStatus)) {
        return res.status(400).json({ message: "Invalid booking status" });
      }
      booking.bookingStatus = bookingStatus;
    }

    if (paymentStatus) {
      if (!['pending', 'paid', 'failed'].includes(paymentStatus)) {
        return res.status(400).json({ message: "Invalid payment status" });
      }
      booking.paymentStatus = paymentStatus;
    }

    await booking.save();

    res.json({ 
      message: "Booking updated successfully", 
      booking 
    });
  } catch (error) {
    console.error("UPDATE BOOKING ERROR:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// COMPLETE BOOKING AND PROCESS CASHBACK
router.put("/complete/:id", auth, async (req, res) => {
  try {
    const bookingId = req.params.id;

    // Find the booking
    const booking = await Booking.findById(bookingId).populate('car');
    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    // Only car provider or admin can complete the booking
    if (booking.car.provider.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ message: "Access denied" });
    }

    // Check if booking is already completed
    if (booking.bookingStatus === 'completed') {
      return res.status(400).json({ message: "Booking is already completed" });
    }

    // Update booking status to completed
    booking.bookingStatus = 'completed';
    await booking.save();

    // Process cashback for the renter
    try {
      // Get renter's wallet
      const renterWallet = await Wallet.findOne({ user: booking.user });
      if (!renterWallet) {
        throw new Error("Renter wallet not found");
      }

      // Get renter's level to calculate cashback
      const cashbackCoins = getCashbackByLevel(renterWallet.level);

      // Update renter's wallet with cashback
      renterWallet.balance += cashbackCoins;
      renterWallet.totalCoinsEarned += cashbackCoins;
      renterWallet.transactions.push({
        type: "cashback",
        amount: cashbackCoins,
        description: `Cashback for completing booking #${booking._id}`
      });

      // Update level based on total coins earned
      const levelRules = [
        { level: "Beginner", minCoins: 0 },
        { level: "Explorer", minCoins: 100 },
        { level: "Pro Renter", minCoins: 300 },
        { level: "Elite", minCoins: 700 },
        { level: "Legend", minCoins: 1500 }
      ];

      const getLevelByCoins = (totalCoinsEarned) => {
        const sortedLevels = [...levelRules].sort((a, b) => b.minCoins - a.minCoins);
        for (const levelRule of sortedLevels) {
          if (totalCoinsEarned >= levelRule.minCoins) {
            return levelRule.level;
          }
        }
        return "Beginner";
      };

      renterWallet.level = getLevelByCoins(renterWallet.totalCoinsEarned);

      // Add badge for first rental if applicable
      if (!renterWallet.badges.includes("First Rental") && renterWallet.transactions.filter(t => t.type === "cashback").length === 1) {
        renterWallet.badges.push("First Rental");
      }
      
      // Add a coupon as a reward for completing booking
      if (booking.bookingStatus === 'completed') {
        // Create a random coupon code for future bookings
        const couponCode = `COUPON_${Date.now()}_${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
        const discountPercent = Math.min(20, 5 + Math.floor(renterWallet.transactions.filter(t => t.type === "cashback").length / 2)); // 5% + 1% per 2 bookings
        
        renterWallet.coupons.push({
          code: couponCode,
          discountPercent: discountPercent,
          expirationDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // Expires in 30 days
        });
      }

      await renterWallet.save();

      // Update the booking with cashback information
      booking.cashbackCoins = cashbackCoins;
      await booking.save();

      res.json({
        message: "Booking completed successfully",
        booking,
        cashback: cashbackCoins
      });
    } catch (cashbackError) {
      console.error("CASHBACK ERROR:", cashbackError);
      // Still return success for the booking completion, even if cashback failed
      res.json({
        message: "Booking completed successfully (note: cashback may not have been processed)",
        booking
      });
    }
  } catch (error) {
    console.error("COMPLETE BOOKING ERROR:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// CANCEL BOOKING (User can cancel their own booking if it's active)
router.delete("/:id", auth, async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    // Only allow the booking user to cancel their booking if it's active
    if (booking.user.toString() !== req.user.id) {
      return res.status(403).json({ message: "Access denied" });
    }

    if (booking.bookingStatus !== 'active') {
      return res.status(400).json({ message: "Cannot cancel a booking that is not active" });
    }

    // Update booking status to cancelled instead of deleting
    booking.bookingStatus = 'cancelled';
    await booking.save();

    res.json({ message: "Booking cancelled successfully" });
  } catch (error) {
    console.error("CANCEL BOOKING ERROR:", error);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;