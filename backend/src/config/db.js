const dns = require("dns");
dns.setServers(["8.8.8.8", "1.1.1.1"]);

const mongoose = require("mongoose");
const env = require("./env");
const logger = require("./logger");

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(env.MONGODB_URI, {
      // Maximum number of database connections that can be open at the same time.
      // If more requests come, they wait until a connection becomes available.
      maxPoolSize: 50,

      // Minimum number of connections to keep ready in the pool.
      // These connections are created when the application starts.
      minPoolSize: 10,

      // Maximum time (45 seconds) to wait for a database operation to respond.
      // If no response is received within this time, the operation times out.
      socketTimeoutMS: 45000,

      // Maximum time (5 seconds) to wait while finding or connecting to a MongoDB server.
      // If no server is found within this time, Mongoose throws a connection error.
      serverSelectionTimeoutMS: 5000,
    });

    logger.info(`🔌 MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    logger.error(`❌ MongoDB connection error: ${error.message}`);
    process.exit(1);
  }
};

mongoose.connection.on("disconnected", () => {
  logger.warn("⚠️ MongoDB disconnected. Attempting to reconnect...");
});

mongoose.connection.on("error", (err) => {
  logger.error(`MongoDB connection error: ${err.message}`);
});

module.exports = { connectDB, mongoose };
