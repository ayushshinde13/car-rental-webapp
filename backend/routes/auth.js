// backend/routes/auth.js

const express = require("express");
const jwt = require("jsonwebtoken");
const User = require("../models/user");
const Wallet = require("../models/wallet");

const router = express.Router();

// =========================
// AUTH MIDDLEWARE
// =========================
const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers["authorization"];
    const token = authHeader && authHeader.split(" ")[1]; // Bearer <token>

    if (!token) {
      return res.status(401).json({ message: "Access token required" });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    if (!decoded || !decoded.userId) {
      return res.status(401).json({ message: "Invalid token payload" });
    }

    // Find user by ID from decoded token
    const user = await User.findById(decoded.userId);
    if (!user) {
      return res.status(401).json({ message: "Invalid token: User not found" });
    }

    // Attach user to request object
    req.user = user;
    next();
  } catch (error) {
    if (error.name === "JsonWebTokenError") {
      return res.status(401).json({ message: "Invalid token" });
    }
    if (error.name === "TokenExpiredError") {
      return res.status(401).json({ message: "Token expired" });
    }
    console.error("AUTH ERROR:", error);
    return res.status(500).json({ message: "Authentication error" });
  }
};

// =========================
// CONTROLLERS
// =========================

// GET CURRENT USER (protected)
const getCurrentUser = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    // Only return safe fields
    res.json({
      user: {
        id: req.user._id,
        name: req.user.name,
        email: req.user.email,
        role: req.user.role,
      },
    });
  } catch (error) {
    console.error("GET CURRENT USER ERROR:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// REGISTER USER
const registerUser = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    // Validate input - check for required fields and validate role
    if (!name || !email || !password) {
      return res.status(400).json({ 
        message: "Missing required fields: name, email, and password are mandatory" 
      });
    }

    // Validate role against allowed values - removed admin
    const validRoles = ['renter', 'provider'];
    const userRole = (role || 'renter').toLowerCase(); // Normalize to lowercase
    if (!validRoles.includes(userRole)) {
      return res.status(400).json({ 
        message: `Invalid role. Role must be one of: ${validRoles.join(', ')}` 
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ message: "Invalid email format" });
    }

    // Validate password strength
    if (password.length < 6) {
      return res.status(400).json({ message: "Password must be at least 6 characters long" });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({ message: "A user with this email already exists" }); // Using 409 Conflict
    }

    // Create new user with validated role
    const user = new User({
      name,
      email,
      password, // This will be hashed by the pre-save hook in the model
      role: userRole, // Use normalized role
    });

    await user.save();

    // Create wallet with initial coins based on role
    let initialCoins = 0;
    if (user.role === "provider") {
      initialCoins = 1000000; // 10 Lakhs coins for provider
    } else if (user.role === "renter") {
      initialCoins = 200000; // 2 Lakhs coins for renter
    }
    
    const wallet = new Wallet({
      user: user._id,
      balance: initialCoins,
      totalCoinsEarned: initialCoins,
      transactions: [{
        type: "credit",
        amount: initialCoins,
        description: `Initial coins for ${user.role} registration`
      }]
    });
    
    await wallet.save();

    // Generate JWT token
    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET,
      { expiresIn: "24h" }
    );

    res.status(201).json({
      message: "User registered successfully",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
      token,
    });
  } catch (error) {
    console.error("REGISTER USER ERROR:", error);
    // Handle specific mongoose validation errors
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({ message: messages.join(', ') });
    }
    // Handle any other server errors
    res.status(500).json({ message: "Server error during registration. Please try again." });
  }
};

// LOGIN USER
const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      return res
        .status(400)
        .json({ message: "Email and password are required" });
    }

    // Find user by email
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // Check password
    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // Generate JWT token
    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET,
      { expiresIn: "24h" }
    );

    res.json({
      message: "Login successful",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
      token,
    });
  } catch (error) {
    console.error("LOGIN USER ERROR:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// =========================
// ROUTES
// =========================
router.post("/register", registerUser);
router.post("/login", loginUser);
router.get("/me", authenticateToken, getCurrentUser);

// Export router to use in server.js
module.exports = router;
