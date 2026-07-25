const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const env = require("../config/env");

const generateAccessToken = (userId, username, deviceId) => {
  return jwt.sign(
    {
      id: userId,
      username,
      deviceId,
    },
    env.JWT_ACCESS_SECRET,
    { expiresIn: "15m" },
  );
};

const generateRefreshToken = (userId, username, deviceId) => {
  const token = jwt.sign(
    {
      id: userId,
      username,
      deviceId,
    },
    env.JWT_REFRESH_SECRET,
    { expiresIn: "30d" },
  );
  
  const refreshHash = crypto.createHash("sha256").update(token).digest("hex");

  return { token, hash: refreshHash };
};

const generateToken = () => {
  const token = crypto.randomBytes(32).toString("hex");
  const hashedToken = crypto.createHash("sha256").update(token).digest("hex")

  return { token, hashedToken };
};

module.exports = { generateAccessToken, generateRefreshToken, generateToken };
