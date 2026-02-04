const multer = require("multer");
const upload = multer({ dest: "uploads/" });

// Example in routes:
router.post("/", auth, upload.array("images", 4), addCar);
