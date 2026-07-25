const express = require("express");
const messageController = require("./message.controller");
const authGuard = require("../../middleware/authGuard");
const apiRateLimiter = require("../../middleware/rateLimiter");

const router = express.Router();

router.use(authGuard);

router.post("/", apiRateLimiter(60, 60), messageController.send);
router.get("/:conversationId", messageController.list);
router.post("/:id/react", apiRateLimiter(30, 60), messageController.react);
router.delete("/:id/react", apiRateLimiter(30, 60), messageController.unreact);
router.patch("/:id", apiRateLimiter(300, 60), messageController.edit);
router.delete("/:id", apiRateLimiter(30, 60), messageController.deleteMsg);

module.exports = router;