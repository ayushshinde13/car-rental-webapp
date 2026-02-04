const express = require("express");
const Cart = require("../models/cart");
const Car = require("../models/car");
const auth = require("../middleware/authmiddleware");

const router = express.Router();

// GET USER CART
router.get("/cart", auth, async (req, res) => {
  try {
    const cart = await Cart.findOne({ user: req.user._id }).populate({
      path: 'items.car',
      populate: {
        path: 'provider',
        select: 'name avatar'
      }
    });

    if (!cart) {
      return res.json({ items: [] });
    }

    res.json(cart);
  } catch (error) {
    console.error("GET CART ERROR:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// ADD ITEM TO CART
router.post("/cart", auth, async (req, res) => {
  try {
    // Only renters can add to cart
    if (req.user.role !== "renter") {
      return res.status(403).json({ message: "Only renters can add items to cart" });
    }

    const { carId, rentalDuration = 1 } = req.body;

    // Validate car exists and is available
    const car = await Car.findById(carId);
    if (!car) {
      return res.status(404).json({ message: "Car not found" });
    }
    
    if (!car.available) {
      return res.status(400).json({ message: "Car is not available for rent" });
    }

    // Find or create user's cart
    let cart = await Cart.findOne({ user: req.user._id });
    if (!cart) {
      cart = new Cart({ user: req.user._id, items: [] });
    }

    // Check if car is already in cart
    const existingItemIndex = cart.items.findIndex(item => item.car.toString() === carId);
    if (existingItemIndex > -1) {
      // Update existing item
      cart.items[existingItemIndex].rentalDuration = rentalDuration;
    } else {
      // Add new item to cart
      cart.items.push({ 
        car: carId, 
        rentalDuration 
      });
    }

    await cart.save();
    
    // Populate the cart before returning
    const populatedCart = await Cart.findById(cart._id).populate({
      path: 'items.car',
      populate: {
        path: 'provider',
        select: 'name avatar'
      }
    });

    res.status(201).json(populatedCart);
  } catch (error) {
    console.error("ADD TO CART ERROR:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// REMOVE ITEM FROM CART
router.delete("/cart/:carId", auth, async (req, res) => {
  try {
    const cart = await Cart.findOne({ user: req.user._id });
    if (!cart) {
      return res.status(404).json({ message: "Cart not found" });
    }

    // Filter out the item to be removed
    cart.items = cart.items.filter(item => 
      item.car.toString() !== req.params.carId
    );

    await cart.save();
    
    // Populate the cart before returning
    const populatedCart = await Cart.findById(cart._id).populate({
      path: 'items.car',
      populate: {
        path: 'provider',
        select: 'name avatar'
      }
    });

    res.json(populatedCart);
  } catch (error) {
    console.error("REMOVE FROM CART ERROR:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// UPDATE CART ITEM DURATION
router.patch("/cart/:carId", auth, async (req, res) => {
  try {
    const { rentalDuration } = req.body;
    
    if (typeof rentalDuration !== 'number' || rentalDuration < 1) {
      return res.status(400).json({ message: "Rental duration must be a positive number" });
    }

    const cart = await Cart.findOne({ user: req.user._id });
    if (!cart) {
      return res.status(404).json({ message: "Cart not found" });
    }

    // Find the item to update
    const item = cart.items.find(item => 
      item.car.toString() === req.params.carId
    );
    
    if (!item) {
      return res.status(404).json({ message: "Item not found in cart" });
    }

    // Update the rental duration
    item.rentalDuration = rentalDuration;
    await cart.save();
    
    // Populate the cart before returning
    const populatedCart = await Cart.findById(cart._id).populate({
      path: 'items.car',
      populate: {
        path: 'provider',
        select: 'name avatar'
      }
    });

    res.json(populatedCart);
  } catch (error) {
    console.error("UPDATE CART ITEM ERROR:", error);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;