const express = require("express");
const multer = require("multer");
const Car = require("../models/car");
const auth = require("../middleware/authmiddleware");
const upload = require("../middleware/upload");

const router = express.Router();

// Configure storage for car images
const carImageStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/cars/");
  },
  filename: (req, file, cb) => {
    cb(
      null,
      `car-${Date.now()}-${Math.round(Math.random() * 1E9)}${file.originalname.substring(file.originalname.lastIndexOf('.'))}`
    );
  },
});
const carUpload = multer({ storage: carImageStorage });

// GET ALL CARS
router.get("/", async (req, res) => {
  try {
    const { brand, provider, available } = req.query;
    let filter = {};

    if (brand) filter.brand = brand;
    if (provider) filter.provider = provider;
    if (available !== undefined) filter.available = available === "true";

    const cars = await Car.find(filter)
      .populate("provider", "name avatar")
      .sort({ createdAt: -1 });

    // Group cars by brand
    const carsByBrand = {};
    cars.forEach(car => {
      const brand = car.brand;
      if (!carsByBrand[brand]) {
        carsByBrand[brand] = [];
      }
      carsByBrand[brand].push(car);
    });

    // Filter brands that have at least 4 cars
    const filteredBrands = {};
    Object.keys(carsByBrand).forEach(brand => {
      if (carsByBrand[brand].length >= 4) {
        filteredBrands[brand] = carsByBrand[brand];
      }
    });

    res.json(filteredBrands);
  } catch (error) {
    console.error("GET CARS ERROR:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// GET SINGLE CAR BY ID
router.get("/:id", async (req, res) => {
  try {
    const car = await Car.findById(req.params.id).populate("provider", "name avatar");
    if (!car) {
      return res.status(404).json({ message: "Car not found" });
    }
    res.json(car);
  } catch (error) {
    console.error("GET CAR ERROR:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// CREATE NEW CAR
router.post("/", auth, carUpload.array("images", 8), async (req, res) => {
  try {
    // Check if user is a provider
    if (req.user.role !== "provider") {
      return res.status(403).json({ message: "Only providers can add cars" });
    }

    // Validate minimum 4 images
    if (!req.files || req.files.length < 4) {
      return res.status(400).json({ message: "Minimum 4 images are required" });
    }

    // Extract image paths
    const imagePaths = req.files.map(file => `/uploads/${file.filename}`);

    const { name, brand, model, year, pricePerDay, fuelType, transmission } = req.body;

    const car = new Car({
      name,
      brand,
      model,
      year: parseInt(year),
      pricePerDay: parseFloat(pricePerDay),
      fuelType,
      transmission,
      images: imagePaths,
      provider: req.user._id,
    });

    await car.save();

    // Populate provider info before returning
    const populatedCar = await Car.findById(car._id).populate("provider", "name avatar");

    res.status(201).json(populatedCar);
  } catch (error) {
    console.error("CREATE CAR ERROR:", error);
    
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({ message: messages.join(', ') });
    }
    
    res.status(500).json({ message: "Server error" });
  }
});

// UPDATE CAR
router.put("/:id", auth, carUpload.array("images", 8), async (req, res) => {
  try {
    const car = await Car.findById(req.params.id);
    if (!car) {
      return res.status(404).json({ message: "Car not found" });
    }

    // Check if user owns the car or is admin
    if (car.provider.toString() !== req.user._id.toString() && req.user.role !== "admin") {
      return res.status(403).json({ message: "Not authorized to update this car" });
    }

    const updateData = req.body;

    // Handle image updates if new images are provided
    if (req.files && req.files.length > 0) {
      // Validate minimum 4 images if updating images
      if (req.files.length < 4) {
        return res.status(400).json({ message: "Minimum 4 images are required" });
      }
      
      updateData.images = req.files.map(file => `/uploads/${file.filename}`);
    }

    // Update car document
    Object.assign(car, updateData);
    await car.save();

    // Populate provider info before returning
    const updatedCar = await Car.findById(car._id).populate("provider", "name avatar");

    res.json(updatedCar);
  } catch (error) {
    console.error("UPDATE CAR ERROR:", error);
    
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({ message: messages.join(', ') });
    }
    
    res.status(500).json({ message: "Server error" });
  }
});

// DELETE CAR
router.delete("/:id", auth, async (req, res) => {
  try {
    const car = await Car.findById(req.params.id);
    if (!car) {
      return res.status(404).json({ message: "Car not found" });
    }

    // Check if user owns the car or is admin
    if (car.provider.toString() !== req.user._id.toString() && req.user.role !== "admin") {
      return res.status(403).json({ message: "Not authorized to delete this car" });
    }

    await Car.findByIdAndDelete(req.params.id);
    res.json({ message: "Car deleted successfully" });
  } catch (error) {
    console.error("DELETE CAR ERROR:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// TOGGLE AVAILABILITY
router.patch("/:id/toggle-availability", auth, async (req, res) => {
  try {
    const car = await Car.findById(req.params.id);
    if (!car) {
      return res.status(404).json({ message: "Car not found" });
    }

    // Check if user owns the car or is admin
    if (car.provider.toString() !== req.user._id.toString() && req.user.role !== "admin") {
      return res.status(403).json({ message: "Not authorized to update this car" });
    }

    car.available = !car.available;
    await car.save();

    res.json({ available: car.available });
  } catch (error) {
    console.error("TOGGLE AVAILABILITY ERROR:", error);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;