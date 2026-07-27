const express = require("express");
const authController = require("./auth.controller");
const validate = require("../../middleware/validate");
const { z } = require("zod");
const authGuard = require("../../middleware/authGuard");
const apiRateLimiter = require("../../middleware/rateLimiter");

const router = express.Router();

// Input Schemas
const registerSchema = z.object({
  body: z.object({
    username: z.string().min(3).max(30),
    email: z.string().email(),
    password: z.string().min(8),
  }),
});

const loginSchema = z.object({
  body: z.object({
    email: z.string().email(),
    password: z.string(),
    deviceId: z.string().optional().default("web-browser"),
    deviceName: z.string().optional().default("Web Browser"),
  }),
});

const verifyEmailSchema = z.object({
  params: z.object({
    token: z.string().min(1, "Verification token is required"),
  }),
});

const resendVerificationSchema = z.object({
  body: z.object({
    email: z.string().email(),
  }),
});

const forgotPasswordSchema = z.object({
  body: z.object({
    email: z.string().email(),
  }),
});

const resetPasswordSchema = z.object({
  params: z.object({
    token: z.string().min(1, "Reset token is required"),
  }),
  body: z.object({
    newPassword: z.string().min(8, "Password must be at least 8 characters"),
  }),
});

// Primary Auth Routes
router.post(
  "/register",
  apiRateLimiter(5, 900),
  validate(registerSchema),
  authController.register,
);
router.post(
  "/login",
  apiRateLimiter(5, 900),
  validate(loginSchema),
  authController.login,
);
router.post("/refresh", authController.refresh);
router.post("/logout", authGuard, authController.logout);

// Email Verification Routes
router.get(
  "/verify-email/:token",
  validate(verifyEmailSchema),
  authController.verifyEmail,
);
router.post(
  "/resend-verification",
  apiRateLimiter(3, 900),
  validate(resendVerificationSchema),
  authController.resendVerificationEmail,
);

// Password Reset Routes
router.post(
  "/forgot-password",
  apiRateLimiter(3, 900),
  validate(forgotPasswordSchema),
  authController.forgotPassword,
);
router.post(
  "/reset-password/:token",
  apiRateLimiter(3, 900),
  validate(resetPasswordSchema),
  authController.resetPassword,
);

module.exports = router;