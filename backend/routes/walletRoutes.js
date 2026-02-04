const express = require("express");
const router = express.Router();
const auth = require("../middleware/authmiddleware");
const Wallet = require("../models/wallet");
const User = require("../models/user");
const Car = require("../models/car");
const Booking = require("../models/booking");
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

// Level rules for gamification
const levelRules = [
  { level: "Beginner", minCoins: 0 },
  { level: "Explorer", minCoins: 100 },
  { level: "Pro Renter", minCoins: 300 },
  { level: "Elite", minCoins: 700 },
  { level: "Legend", minCoins: 1500 }
];

// Helper function to determine level based on coins earned
const getLevelByCoins = (totalCoinsEarned) => {
  // Sort levels by minCoins in descending order to find the highest applicable level
  const sortedLevels = [...levelRules].sort((a, b) => b.minCoins - a.minCoins);
  
  for (const levelRule of sortedLevels) {
    if (totalCoinsEarned >= levelRule.minCoins) {
      return levelRule.level;
    }
  }
  
  return "Beginner"; // Default level
};

// GET USER WALLET
router.get("/me", auth, async (req, res) => {
  try {
    let wallet = await Wallet.findOne({ user: req.user.id }).populate('user', 'name email role');
    
    if (!wallet) {
      // Create wallet if it doesn't exist
      wallet = new Wallet({
        user: req.user.id,
        balance: 0,
        totalCoinsEarned: 0,
        level: "Beginner",
        badges: [],
        coupons: []
      });
      
      await wallet.save();
    }
    
    res.json(wallet);
  } catch (error) {
    console.error("GET WALLET ERROR:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// CREATE PAYMENT INTENT FOR COIN PURCHASE
router.post("/create-coin-payment-intent", auth, async (req, res) => {
  try {
    const { packId } = req.body;

    // Define coin packs
    const coinPacks = {
      starter: { coins: 100, price: 9900 }, // 99 INR in paisa
      pro: { coins: 300, price: 24900 },   // 249 INR in paisa
      elite: { coins: 700, price: 49900 }  // 499 INR in paisa
    };

    if (!coinPacks[packId]) {
      return res.status(400).json({ message: "Invalid coin pack" });
    }

    const pack = coinPacks[packId];

    const paymentIntent = await stripe.paymentIntents.create({
      amount: pack.price, // Amount in paisa (smallest currency unit)
      currency: "inr",
      metadata: {
        userId: req.user.id,
        packId: packId,
        coins: pack.coins
      }
    });

    res.send({
      clientSecret: paymentIntent.client_secret,
    });
  } catch (error) {
    console.error("CREATE COIN PAYMENT INTENT ERROR:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// ADD COINS TO WALLET AFTER PAYMENT VERIFICATION
router.post("/add-coins", auth, async (req, res) => {
  try {
    const { coinsToAdd, packId } = req.body;

    if (!coinsToAdd || coinsToAdd <= 0) {
      return res.status(400).json({ message: "Invalid coins amount" });
    }

    // Find or create wallet
    let wallet = await Wallet.findOne({ user: req.user.id });
    if (!wallet) {
      wallet = new Wallet({
        user: req.user.id,
        balance: 0,
        totalCoinsEarned: 0,
        level: "Beginner",
        badges: [],
        coupons: []
      });
    }

    // Update balance and total coins earned
    wallet.balance += coinsToAdd;
    wallet.totalCoinsEarned += coinsToAdd;

    // Add transaction
    wallet.transactions.push({
      type: "purchase",
      amount: coinsToAdd,
      description: `Purchased ${coinsToAdd} coins with pack: ${packId}`
    });

    // Recalculate level based on total coins earned
    wallet.level = getLevelByCoins(wallet.totalCoinsEarned);

    await wallet.save();

    res.json({ 
      message: "Coins added successfully", 
      wallet: {
        balance: wallet.balance,
        level: wallet.level
      }
    });
  } catch (error) {
    console.error("ADD COINS ERROR:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// GET WALLET ANALYTICS
router.get("/analytics", auth, async (req, res) => {
  try {
    const wallet = await Wallet.findOne({ user: req.user.id });

    if (!wallet) {
      return res.status(404).json({ message: "Wallet not found" });
    }

    // Calculate analytics
    const totalSpent = wallet.transactions
      .filter(t => t.type === "debit" || t.type === "rental")
      .reduce((sum, t) => sum + t.amount, 0);
    
    const totalCashback = wallet.transactions
      .filter(t => t.type === "cashback")
      .reduce((sum, t) => sum + t.amount, 0);
    
    // Get recent transactions
    const recentTransactions = [...wallet.transactions]
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, 10);

    res.json({
      balance: wallet.balance,
      totalCoinsEarned: wallet.totalCoinsEarned,
      level: wallet.level,
      totalSpent,
      totalCashback,
      badges: wallet.badges,
      recentTransactions,
      levelProgress: {
        currentLevel: wallet.level,
        nextLevel: getNextLevel(wallet.level),
        progress: calculateLevelProgress(wallet.totalCoinsEarned, wallet.level)
      }
    });
  } catch (error) {
    console.error("WALLET ANALYTICS ERROR:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Helper function to get the next level
function getNextLevel(currentLevel) {
  const currentIndex = levelRules.findIndex(l => l.level === currentLevel);
  if (currentIndex === -1 || currentIndex === levelRules.length - 1) {
    return null; // Already at the highest level
  }
  return levelRules[currentIndex + 1].level;
}

// Helper function to calculate level progress
function calculateLevelProgress(totalCoins, currentLevel) {
  const currentLevelRule = levelRules.find(l => l.level === currentLevel);
  if (!currentLevelRule) return { percent: 0, remaining: 0 };

  // If this is the highest level, return 100%
  const currentIndex = levelRules.findIndex(l => l.level === currentLevel);
  if (currentIndex === levelRules.length - 1) {
    return { percent: 100, remaining: 0 };
  }

  const nextLevelRule = levelRules[currentIndex + 1];
  const minCoinsForCurrent = currentLevelRule.minCoins;
  const minCoinsForNext = nextLevelRule.minCoins;
  const range = minCoinsForNext - minCoinsForCurrent;
  const progressInLevel = totalCoins - minCoinsForCurrent;
  
  const percent = Math.min(100, Math.round((progressInLevel / range) * 100));
  const remaining = Math.max(0, minCoinsForNext - totalCoins);

  return { percent, remaining };
}

module.exports = router;