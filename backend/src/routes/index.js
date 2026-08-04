const express = require("express");
const authRoutes = require("../modules/auth/auth.routes");
const userRoutes = require("../modules/users/user.routes");
const chatRoutes = require("../modules/chats/chat.routes");
const messageRoutes = require("../modules/messages/message.routes");
const fileRoutes = require("../modules/files/file.routes");
const notificationRoutes = require("../modules/notifications/notification.routes");
const callRoutes = require("../modules/calls/call.routes");
const router = express.Router();

// Register Feature Routers
router.use("/auth", authRoutes);
router.use("/users", userRoutes);
router.use("/chats", chatRoutes);
router.use("/messages", messageRoutes);
router.use("/files", fileRoutes);
router.use("/notifications", notificationRoutes);
router.use("/calls", callRoutes);

module.exports = router;
