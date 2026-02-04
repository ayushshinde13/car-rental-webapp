require("dotenv").config();
const express = require('express');
const mongoose = require("mongoose");
const cors = require("cors");
const fs = require("fs");
const path = require("path");

// Import models to ensure they're loaded
require('./models/user');
require('./models/car');
require('./models/booking');
require('./models/payment');
require('./models/wallet'); // New wallet model
require('./models/feedback'); // New feedback model
require('./models/cart'); // Cart model

const authRoutes = require("./routes/auth");       // Authentication routes
const carRoutes = require("./routes/carroutes");   // Car management routes
const bookingRoutes = require("./routes/bookingRoutes"); // Booking routes
const paymentRoutes = require("./routes/paymentRoutes"); // Payment routes
const userRoutes = require("./routes/userRoutes"); // User management routes including cart
const walletRoutes = require("./routes/walletRoutes"); // New wallet routes
const feedbackRoutes = require("./routes/feedbackRoutes"); // New feedback routes

const app = express();

// Validate required environment variables
const requiredEnvVars = ['MONGO_URI'];
const missingEnvVars = requiredEnvVars.filter(envVar => !process.env[envVar]);

if (missingEnvVars.length > 0) {
  console.error('❌ Missing required environment variables:');
  missingEnvVars.forEach(envVar => {
    console.error(`   - ${envVar}`);
  });
  console.error('\n💡 Please add these variables to your .env file in the backend directory.');
  process.exit(1);
}

// Warn about optional but recommended environment variables
if (!process.env.STRIPE_SECRET_KEY) {
  console.warn('⚠️  STRIPE_SECRET_KEY is not set. Payment processing will not work.');
  console.warn('💡  Get your key from https://dashboard.stripe.com/test/apikeys');
  console.warn('💡  Add it to your .env file as: STRIPE_SECRET_KEY=sk_test_...');
}

// -------------------------------------------
// Create uploads folder if not exist
// -------------------------------------------
const uploadsDir = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir);
  console.log("✔ uploads folder created");
}

// -------------------------------------------
// Middlewares
// -------------------------------------------
app.use(
  cors({
    origin: ["http://localhost:5173", "http://localhost:3000"],
    credentials: true,
  })
);

app.use(express.json());

// Serve uploaded images
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// -------------------------------------------
// API Routes
// -------------------------------------------
app.use("/api/auth", authRoutes);
app.use("/api/cars", carRoutes);
app.use("/api/bookings", bookingRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/users", userRoutes); // This includes cart routes
app.use("/api/wallet", walletRoutes); // New wallet routes
app.use("/api/feedback", feedbackRoutes); // New feedback routes

// -------------------------------------------
// MongoDB Connection
// -------------------------------------------
const connectDB = async () => {
  try {
    console.log("Attempting to connect to MongoDB...");
    console.log("MONGO_URI:", process.env.MONGO_URI ? process.env.MONGO_URI.replace(/\/\/.*@/, '//***@') : "Not set"); // Hide credentials in log
    
    // Enhanced connection options for better stability
    const options = {
      serverSelectionTimeoutMS: 30000, // Timeout after 30s
      bufferCommands: false, // Disable mongoose buffering
    };

    await mongoose.connect(process.env.MONGO_URI, options);
    console.log("✔ MongoDB connected successfully");
    
    const PORT = process.env.PORT || 5000;
    app.listen(PORT, () => {
      console.log(`✔ Server running on http://localhost:${PORT}`);
    });
  } catch (err) {
    console.error("❌ MongoDB Connection Error:", err.message);
    console.error("Error details:", {
      message: err.message,
      name: err.name,
      code: err.code,
      reason: err.reason
    });
    
    // More specific error handling
    if (err.name === 'MongoServerSelectionError') {
      console.error("\n💡 This error usually means MongoDB is not running.");
      console.error("💡 Please start MongoDB using: net start MongoDB (as Administrator)");
    }
    
    process.exit(1);
  }
};

// Call the connectDB function
connectDB();

// Handle Mongoose connection events
mongoose.connection.on('error', (err) => {
  console.error('Mongoose connection error:', err);
});

mongoose.connection.on('disconnected', () => {
  console.log('Mongoose disconnected');
});

// Graceful shutdown
process.on('SIGINT', async () => {
  await mongoose.connection.close();
  console.log('Mongoose connection closed through app termination');
  process.exit(0);
});