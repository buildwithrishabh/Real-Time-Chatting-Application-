const User = require("../../model/User");
const Session = require("../../model/Session");

const createUser = async (username, email, passwordHash) => {
  return User.create({ username, email, passwordHash });
};

const findUserByEmail = async (email) => {
  return User.findOne({ email }).select("+passwordHash");
};

const findUserById = async (id) => {
  return User.findById(id);
};

const saveSession = async (sessionData) => {
  return Session.findOneAndUpdate(
    {
      userId: sessionData.userId,
      deviceId: sessionData.deviceId,
    },
    sessionData,
    { upsert: true, new: true },
  );
};

const findSession = async (userId, deviceId) => {
  return Session.findOne({ userId, deviceId });
};

const revokeSession = async (userId, deviceId) => {
  return Session.findOneAndUpdate({ userId, deviceId }, { isRevoked: true });
};

const revokeAllUserSessions = async (userId) => {
  return Session.updateMany({ userId }, { isRevoked: true });
};

const setVerificationToken = async (userId, hashedToken, expiresAt) => {
  return User.findByIdAndUpdate(userId, {
    emailVerificationToken: hashedToken,
    emailVerificationExpires: expiresAt,
  });
};

const findUserByVerificationToken = async (hashedToken) => {
  return User.findOne({
    emailVerificationToken: hashedToken,
    emailVerificationExpires: { $gt: Date.now() },
  });
};

const markEmailAsVerified = async (userId) => {
  return User.findByIdAndUpdate(
    userId,
    {
      isEmailVerified: true,
      $unset: { emailVerificationToken: 1, emailVerificationExpires: 1 },
    },
    {
      new: true,
    },
  );
};

const savePasswordResetToken = async (userId, hashedToken, expiresAt) => {
  return User.findByIdAndUpdate(userId, {
    passwordResetToken: hashedToken,
    passwordResetExpires: expiresAt,
  });
};

const findUserByResetToken = async (hashedToken) => {
  return User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: Date.now() },
  }).select("+passwordHash");
};

const updateUserPassword = async (userId, newPasswordHash) => {
  return User.findByIdAndUpdate(
    userId,
    {
      passwordHash: newPasswordHash,
      $unset: { passwordResetToken: 1, passwordResetExpires: 1 },
    },
    {
      new: true,
    },
  );
};

module.exports = {
  createUser,
  findUserByEmail,
  findUserById,
  saveSession,
  findSession,
  revokeSession,
  revokeAllUserSessions,
  setVerificationToken,
  findUserByVerificationToken,
  markEmailAsVerified,
  savePasswordResetToken,
  findUserByResetToken,
  updateUserPassword,
};
