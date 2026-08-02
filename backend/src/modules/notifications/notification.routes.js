const express = require("express");
const {
  getNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  deleteAllNotifications,
} = { ...require("./notification.controller") };
const authGuard = require("../../middleware/authGuard");

const router = express.Router();

// All notification routes require authentication
router.use(authGuard);

router.get("/", getNotifications);
router.get("/unread-count", getUnreadCount);
router.patch("/read-all", markAllAsRead);
router.patch("/:id/read", markAsRead);
router.delete("/clear-all", deleteAllNotifications);
router.delete("/:id", deleteNotification);

module.exports = router;
