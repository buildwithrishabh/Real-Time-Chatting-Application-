const logger = require("../config/logger");
const env = require("../config/env");

module.exports = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || "error";

  logger.error(err);

  if (env.NODE_ENV === "development") {
    return res.status(err.statusCode).json({
      success: false,
      status: err.status,
      error: err,
      message: err.message,
      stack: err.stack,
    });
  }

  return res.status(err.statusCode).json({
    success: false,
    status: err.status,
    message: err.isOperational ? err.message : "Internal Server Error",
  });
};
