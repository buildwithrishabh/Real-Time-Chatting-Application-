const express = require("express");
const fileController = require("./file.controller");
const authGuard = require("../../middleware/authGuard"); // Auth middleware
const apiRateLimiter = require("../../middleware/rateLimiter");

const router = express.Router();

// Webhook endpoint (Requires open public access for Cloudinary callbacks)
router.post("/webhook/scan", fileController.handleScanWebhook);

// Protected routes
router.use(authGuard);

router.get("/sign", apiRateLimiter(30, 60), fileController.getSignUrl);
router.post("/verify", apiRateLimiter(20, 60), fileController.verifyUploads);
router.get("/:fileId/download", apiRateLimiter(60, 60), fileController.downloadFile);

module.exports = router;