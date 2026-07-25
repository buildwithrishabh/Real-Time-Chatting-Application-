const express = require("express");
const userController = require("./user.controller");
const validate = require("../../middleware/validate");
const authGuard = require("../../middleware/authGuard");
const { z } = require("zod");

const router = express.Router();

// Input Schemas
const completeProfileSchema = z.object({
  body: z.object({
    displayName: z.string().min(2).max(50).optional(),
    bio: z.string().max(500).optional(),
    avatarUrl: z.string().url().optional().or(z.literal("")),
    avatarPublicId: z.string().optional(),
  }),
});

const updateProfileSchema = z.object({
  body: z.object({
    displayName: z.string().min(2).max(50).optional(),
    bio: z.string().max(500).optional(),
    avatarUrl: z.string().url().optional().or(z.literal("")),
    avatarPublicId: z.string().optional(),
    privacySettings: z
      .object({
        onlineStatus: z.enum(["public", "contacts", "private"]).optional(),
        lastSeen: z.enum(["public", "contacts", "private"]).optional(),
      })
      .optional(),
  }),
});

router.use(authGuard);

router.get("/me", userController.getMe);
router.post(
  "/complete-profile",
  validate(completeProfileSchema),
  userController.completeProfile,
);
router.patch(
  "/profile",
  validate(updateProfileSchema),
  userController.updateProfile,
);
router.get("/search", userController.searchUsers);
router.get("/:id", userController.getUserById);

module.exports = router;
