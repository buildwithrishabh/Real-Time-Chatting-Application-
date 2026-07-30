const express = require("express");
const helmet = require("helmet");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const compression = require("compression");
const morgan = require("morgan");
const env = require("./config/env");
const logger = require("./config/logger");
const errorHandler = require("./middleware/error");
const { AppError } = require("./common/appError");

const apiRouter = require("./routes");

const app = express();

app.use(helmet());

const allowedOrigins = [
  "http://localhost:3000",
  "http://localhost:5173",
  "http://127.0.0.1:3000",
  "http://127.0.0.1:5173",
  "https://chattingz.netlify.app"
];

if (env.CORS_ORIGIN) {
  allowedOrigins.push(env.CORS_ORIGIN.replace(/\/$/, ""));
}

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (e.g. mobile apps, curl) or allowed origins
      if (
        !origin ||
        env.NODE_ENV === "development" ||
        allowedOrigins.includes(origin) ||
        allowedOrigins.includes(origin.replace(/\/$/, ""))
      ) {
        return callback(null, true);
      }
      return callback(null, true);
    },
    credentials: true,
  }),
);

app.use(compression());
app.use(cookieParser(env.COOKIE_SECRET));
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Logging HTTP Requests using Morgan bound to Winston
const morganFormat = env.NODE_ENV === "production" ? "combined" : "dev";
app.use(
  morgan(morganFormat, {
    stream: { write: (message) => logger.info(message.trim()) },
  }),
);

// Base Health Check endpoint
app.get("/health", (req, res) => {
  res.status(200).json({
    success: true,
    status: "UP",
    timestamp: new Date(),
    uptime: process.uptime(),
  });
});

app.use("/api/v1", apiRouter);

app.use((req, res, next) => {
  next(
    new AppError(
      `Cannot find ${req.originalUrl} on this server`,
      404,
    ),
  );
});

app.use(errorHandler);

module.exports = app;