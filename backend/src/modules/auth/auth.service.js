const authRepository = require("./auth.repository");
const { AppError, StatusCodes } = require("../../common/appError");
const {
  generateAccessToken,
  generateRefreshToken,
  generateToken,
} = require("../../utils/token");
const { sendEmailJob } = require("../../queues/email.queue");
const { redis } = require("../../redis/client");
const crypto = require("crypto");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const config = require("../../config/env");

const register = async ({ username, email, password }) => {
  const existing = await authRepository.findUserByEmail(email);
  if (existing) {
    throw new AppError("Email already exists", StatusCodes.BAD_REQUEST);
  }

  const user = await authRepository.createUser(username, email, password);

  const { token, hashedToken } = generateToken();
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
  await authRepository.setVerificationToken(user._id, hashedToken, expiresAt);

  // send verification email via background queue

  await sendEmailJob("otp_verification", email, { otp: token });

  return {
    id: user._id,
    username: user.username,
    email: user.email,
    verificationToken: token,
  };
};

const login = async ({
  email,
  password,
  deviceId,
  deviceName,
  ipAddress,
  userAgent,
}) => {
  const user = await authRepository.findUserByEmail(email);
  if (!user || !(await user.comparePassword(password))) {
    throw new AppError("Invalid credentials", StatusCodes.UNAUTHORIZED);
  }

  if (!user.isEmailVerified) {
    throw new AppError(
      "Please verify your email before logging in",
      StatusCodes.FORBIDDEN,
    );
  }

  const accessToken = generateAccessToken(user._id, user.username, deviceId);

  const { token: refreshToken, hash: refreshHash } = generateRefreshToken(
    user._id,
    user.username,
    deviceId,
  );

  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 Days expire time

  await redis.set(
    `session:${user._id}:${deviceId}`,
    refreshHash,
    "EX",
    30 * 24 * 60 * 60,
  );

  await authRepository.saveSession({
    userId: user._id,
    refreshTokenHash: refreshHash,
    deviceId,
    deviceName,
    ipAddress,
    userAgent,
    expiresAt,
  });

  return {
    accessToken,
    refreshToken,
    isProfileComplete: user.isProfileComplete,
  };
};

const rotateTokens = async (token) => {
  let decoded;
  try {
    decoded = jwt.verify(token, config.JWT_REFRESH_SECRET);
  } catch (err) {
    throw new AppError("Invalid refresh token", StatusCodes.UNAUTHORIZED);
  }

  const { id: userId, deviceId } = decoded;

  const incomingHash = crypto.createHash("sha256").update(token).digest("hex");

  const sessionKey = `session:${userId}:${deviceId}`;
  const activeHash = await redis.get(sessionKey);

  if (activeHash !== incomingHash) {
    await redis.del(sessionKey);
    await authRepository.revokeAllUserSessions(userId);
    throw new AppError(
      "Warning: Refresh token reuse detected. All sessions revoked",
      StatusCodes.UNAUTHORIZED,
    );
  }

  const user = await authRepository.findUserById(userId);
  if (!user || user.status !== "active") {
    throw new AppError(
      "User account suspended or not found",
      StatusCodes.UNAUTHORIZED,
    );
  }

  const newAccessToken = generateAccessToken(userId, user.username, deviceId);
  const { token: newRefreshToken, hash: newRefreshTokenHash } =
    generateRefreshToken(userId, user.username, deviceId);

  await redis.set(sessionKey, newRefreshTokenHash, "EX", 30 * 24 * 60 * 60);
  await authRepository.saveSession({
    userId,
    refreshTokenHash: newRefreshTokenHash,
    deviceId,
    lastActiveAt: new Date(),
    expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
  });

  return { accessToken: newAccessToken, refreshToken: newRefreshToken };
};

const logout = async (userId, deviceId) => {
  await redis.del(`session:${userId}:${deviceId}`);
  await authRepository.revokeSession(userId, deviceId);
  return { success: true };
};

const verifyEmail = async (token) => {
  const hashedToken = crypto.createHash("sha256").update(token).digest("hex");
  const user = await authRepository.findUserByVerificationToken(hashedToken);

  if (!user) {
    throw new AppError(
      "Invalid or expired email verification token",
      StatusCodes.BAD_REQUEST,
    );
  }

  await authRepository.markEmailAsVerified(user._id);
  return { success: true, message: "Email verified successfully" };
};

const resendVerificationEmail = async (email) => {
  const user = await authRepository.findUserByEmail(email);
  if (!user) {
    throw new AppError("User not found with this email", StatusCodes.NOT_FOUND);
  }

  if (user.isEmailVerified) {
    throw new AppError("Email is already verified", StatusCodes.BAD_REQUEST);
  }

  const { token, hashedToken } = generateToken();
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
  await authRepository.setVerificationToken(user._id, hashedToken, expiresAt);


  await sendEmailJob("otp_verification", email, { otp: token });

  return {
    success: true,
    message: "Verification email resent successfully",
    verificationToken: token,
  };
};

const forgotPassword = async (email) => {
  const user = await authRepository.findUserByEmail(email);
  if (!user) {
    // Return generic message to prevent account enumeration attacks
    return {
      message:
        "If an account with that email exists, a password reset link has been sent.",
    };
  }

  const { token, hashedToken } = generateToken();
  const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes
  await authRepository.savePasswordResetToken(user._id, hashedToken, expiresAt);


  await sendEmailJob("password_reset", email, { token });
  
  return {
    message:
      "If an account with that email exists, a password reset link has been sent.",
    resetToken: token,
  };
};

const resetPassword = async ({ token: rawToken, newPassword }) => {
  const hashedToken = crypto
    .createHash("sha256")
    .update(rawToken)
    .digest("hex");

  const user = await authRepository.findUserByResetToken(hashedToken);

  if (!user) {
    throw new AppError(
      "Invalid or expired password reset token",
      StatusCodes.BAD_REQUEST,
    );
  }

  // Hash new password and save
  const salt = await bcrypt.genSalt(10);
  const newPasswordHash = await bcrypt.hash(newPassword, salt);
  await authRepository.updateUserPassword(user._id, newPasswordHash);

  // Security Hardening: Revoke all active sessions across all devices
  await authRepository.revokeAllUserSessions(user._id);

  return {
    success: true,
    message: "Password reset successful. Please log in with your new password.",
  };
};

module.exports = {
  register,
  login,
  rotateTokens,
  rotateToken: rotateTokens,
  logout,
  verifyEmail,
  resendVerificationEmail,
  forgotPassword,
  resetPassword,
};
