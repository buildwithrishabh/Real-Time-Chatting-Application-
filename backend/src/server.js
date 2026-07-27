const dns = require("dns");
dns.setServers(["8.8.8.8", "1.1.1.1"]);

const http = require("http");
const app = require("./app");
const env = require("./config/env");
const logger = require("./config/logger");
const { connectDB } = require("./config/db");
const { initSocket } = require("./socket");
const { startWorkers } = require("./queues/worker");

const server = http.createServer(app);

// Initialize Socket.io with the HTTP server
initSocket(server);

// Bind Server Port
const PORT = env.PORT;

const startServer = async () => {
  try {
    // 1. Establish Database connection first
    await connectDB();

    // 2. Start Background Queue Workers (Email & Push Notifications)
    startWorkers();

    // 3. Start HTTP Server
    server.listen(PORT, () => {
      logger.info(
        `🚀 Stateless Server running in [${env.NODE_ENV}] mode on port ${PORT}`,
      );
    });
  } catch (error) {
    logger.error(`❌ Failed to start server: ${error.message}`);
    process.exit(1);
  }
};

// Handle System-level events or unexpected crashes
process.on("unhandledRejection", (err) => {
  logger.error("❌ UNHANDLED REJECTION! Shutting down gracefully...");
  logger.error(err);
  server.close(() => {
    process.exit(1);
  });
});

process.on("uncaughtException", (err) => {
  logger.error("❌ UNCAUGHT EXCEPTION! Shutting down gracefully...");
  logger.error(err);
  process.exit(1);
});

process.on("SIGTERM", () => {
  logger.info("👋 SIGTERM received. Shutting down server gracefully...");
  server.close(() => {
    logger.info("Process terminated.");
  });
});

startServer();
