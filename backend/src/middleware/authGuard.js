const jwt = require("jsonwebtoken");
const config = require("../config/env");
const { AppError, StatusCodes } = require("../common/appError");
const { redis } = require("../redis/client");

const authGuard = async (req, res, next) => {
  const authHeader = req.headers["authorization"];
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return next(
      new AppError(
        "Missing or malformed authorization token",
        StatusCodes.UNAUTHORIZED,
      ),
    );
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, config.JWT_ACCESS_SECRET);

    // Check if the session is still active in Redis
    const sessionKey = `session:${decoded.id}:${decoded.deviceId}`;
    const sessionExists = await redis.exists(sessionKey);
    if (!sessionExists) {
      return next(
        new AppError("Session expired or revoked", StatusCodes.UNAUTHORIZED),
      );
    }

    req.user = decoded;
    next();
  } catch (err) {
     return next(new AppError("Invalid access token", StatusCodes.UNAUTHORIZED));
  }
};


module.exports = authGuard;
