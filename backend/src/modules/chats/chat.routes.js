const express = require("express");
const chatController = require("./chat.controller");
const authGuard = require("../../middleware/authGuard");
const apiRateLimiter = require("../../middleware/rateLimiter");

const router = express.Router();

router.use(authGuard);

router.post("/", apiRateLimiter(30, 60), chatController.create);
router.get("/", chatController.list);
router.post("/:conversationId/participants", chatController.addParticipant);
router.delete(
  "/:conversationId/participants/:userId",
  chatController.removeParticipant,
);
router.delete("/:conversationId", chatController.deleteGroupChat);
router.patch(
  "/:conversationId/participants/:userId/role",
  chatController.updateRole,
);

module.exports = router;