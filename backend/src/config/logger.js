const winston = require("winston");
const DailyRotateFile = require("winston-daily-rotate-file");
const config = require("./env");

const { combine, timestamp, json, colorize, printf, errors } = winston.format;

const devFormat = printf(({ level, message, timestamp, stack }) => {
  return `${timestamp} [${level}]: ${stack || message}`;
});

const logger = winston.createLogger({
  level: config.NODE_ENV === "production" ? "info" : "debug",
  format: combine(
    timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
    errors({ stack: true }),
    config.NODE_ENV === "production" ? json() : devFormat,
  ),

  transports: [
    // Console transport (essential for Render, Docker, PM2, AWS stdout logs)
    new winston.transports.Console({
      format:
        config.NODE_ENV === "production"
          ? combine(timestamp({ format: "YYYY-MM-DD HH:mm:ss" }), json())
          : combine(colorize(), timestamp({ format: "HH:mm:ss" }), devFormat),
    }),
    // Consolidated logs file
    new DailyRotateFile({
      filename: "logs/combined-%DATE%.log",
      datePattern: "YYYY-MM-DD",
      zippedArchive: true,
      maxSize: "20m",
      maxFiles: "14d",
      level: "info",
    }),
    
    // Error logs file only
    new DailyRotateFile({
      filename: "logs/error-%DATE%.log",
      datePattern: "YYYY-MM-DD",
      zippedArchive: true,
      maxSize: "20m",
      maxFiles: "30d",
      level: "error",
    }),
  ],
});

module.exports = logger;
