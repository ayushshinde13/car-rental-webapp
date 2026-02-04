const Car = require("../models/car");
const fs = require("fs");
const path = require("path");
const { body, validationResult } = require("express-validator");

// Middleware to validate request body
const validateCarInput = [
  body("name").notEmpty().withMessage("Name is required"),
  body("brand").notEmpty().withMessage("Brand is required"),
  body("year")
    .isInt({ min: 1900, max: new Date().getFullYear() })
    .withMessage("Year must be between 1900 and current year"),
  body("coinsRequired")
    .isFloat({ min: 1 })
    .withMessage("Coins required must be a positive number"),
];

// GET SINGLE CAR
exports.getCarById = async (req, res) => {
  try {
    const car = await Car.findById(req.params.id).populate('owner', 'name email');
    
    if (!car) {
      return res.status(404).json({ message: "Car not found" });
    }

    // Format image URLs with base URL
    const baseUrl = process.env.BASE_URL || "http://localhost:5000";
    const formattedImages = car.images.map(img => {
      // Check if image is already a full URL or a local path
      if (img.startsWith('http')) {
        return img;
      } else {
        return `${baseUrl}/${img}`;
      }
    });

    const carWithFormattedImages = {
      ...car.toObject(),
      images: formattedImages
    };

    res.json(carWithFormattedImages);
  } catch (error) {
    console.error("GET CAR BY ID ERROR:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// ADD CAR
exports.addCar = [
  validateCarInput,
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ message: errors.array()[0].msg });
      }

      const { name, brand, year, coinsRequired } = req.body;

      if (!req.files || req.files.length === 0)
        return res.status(400).json({ message: "At least 1 image is required!" });

      // Validate file types (only allow images)
      const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
      for (const file of req.files) {
        if (!allowedTypes.includes(file.mimetype)) {
          return res.status(400).json({ message: "Only JPEG, PNG, and WebP images are allowed." });
        }
      }

      const imagePaths = req.files.map((file) =>
        file.path.replace(/\\/g, "/")
      );

      const car = new Car({
        name,
        brand,
        year,
        coinsRequired,
        images: imagePaths,
        owner: req.user.id,
      });

      await car.save();

      res.status(201).json({ message: "Car added successfully!", car });
    } catch (error) {
      console.error("ADD CAR ERROR:", error);
      res.status(500).json({ message: "Server error" });
    }
  },
];

// GET ALL CARS
exports.getCars = async (req, res) => {
  try {
    // Build query - exclude cars owned by the current user
    let query = {};
    if (req.user) {
      query.owner = { $ne: req.user.id }; // Don't show user's own cars when browsing
    }
    
    const cars = await Car.find(query).populate('owner', 'name email');
    
    // Format image URLs with base URL for all cars
    const baseUrl = process.env.BASE_URL || "http://localhost:5000";
    const formattedCars = cars.map(car => {
      const formattedImages = car.images.map(img => {
        // Check if image is already a full URL or a local path
        if (img.startsWith('http')) {
          return img;
        } else {
          return `${baseUrl}/${img}`;
        }
      });

      return {
        ...car.toObject(),
        images: formattedImages
      };
    });

    res.json(formattedCars);
  } catch (error) {
    console.error("GET CARS ERROR:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// GET ONLY MY CARS
exports.getMyCars = async (req, res) => {
  try {
    const cars = await Car.find({ owner: req.user.id });

    const baseUrl = process.env.BASE_URL || "http://localhost:5000";
    const formattedCars = cars.map(car => {
      const formattedImages = car.images.map(img => {
        // Check if image is already a full URL or a local path
        if (img.startsWith('http')) {
          return img;
        } else {
          return `${baseUrl}/${img}`;
        }
      });

      return {
        ...car.toObject(),
        images: formattedImages
      };
    });

    res.json(formattedCars);
  } catch (error) {
    console.error("MY CARS ERROR:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// UPDATE CAR
exports.updateCar = [
  validateCarInput,
  async (req, res) => {
    try {
      const car = await Car.findById(req.params.id);
      if (!car) return res.status(404).json({ message: "Car not found" });

      // Ensure user owns the car
      if (car.owner.toString() !== req.user.id)
        return res.status(403).json({ message: "Not authorized to update this car" });

      const updated = await Car.findByIdAndUpdate(
        req.params.id,
        req.body,
        { new: true }
      );

      res.json(updated);
    } catch (error) {
      console.error("UPDATE CAR ERROR:", error);
      res.status(500).json({ message: "Server error" });
    }
  },
];

// DELETE CAR
exports.deleteCar = async (req, res) => {
  try {
    const car = await Car.findById(req.params.id);
    if (!car) return res.status(404).json({ message: "Car not found" });

    // Ensure user owns the car
    if (car.owner.toString() !== req.user.id)
      return res.status(403).json({ message: "Not authorized to delete this car" });

    // Delete associated image files
    for (const imagePath of car.images) {
      const fullPath = path.join(__dirname, "..", imagePath);
      if (fs.existsSync(fullPath)) {
        fs.unlinkSync(fullPath);
      }
    }

    await Car.findByIdAndDelete(req.params.id);

    res.json({ message: "Car deleted successfully" });
  } catch (error) {
    console.error("DELETE CAR ERROR:", error);
    res.status(500).json({ message: "Server error" });
  }
};