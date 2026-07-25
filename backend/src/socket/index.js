const { Server } = require("socket.io");
const { createAdapter } = require("@socket.io/redis-adapter");
const jwt = require("jsonwebtoken");
const env = require("../config/env");
const { redis } = require("../redis/client");
const logger = require("../config/logger");

// Event Handlers
const registerMessageHandlers = require("./handlers/message.handler");
const registerPresenceHandlers = require("./handlers/presence.handler");
const registerTypingHandlers = require("./handlers/typing.handler");
const registerReceiptHandlers = require("./handlers/receipt.handler");

let io;

const initSocket = (server) => {
  io = new Server(server, {
    cors: { 
      origin: true,
      credentials: true,
    },
    pingTimeout: 60000,
    pingInterval: 25000,
  });

  // Enable Redis Pub/Sub Adapter for multi-instance scaling
  const pubClient = redis;
  const subClient = redis.duplicate();
  io.adapter(createAdapter(pubClient, subClient));

  // Authenticate Socket Connection
  io.use(async (socket, next) => {
    const token =
      socket.handshake.auth.token || socket.handshake.headers["authorization"];
    if (!token) {
      return next(new Error("Authentication failed: Missing token"));
    }

    try {
      const tokenString = token.startsWith("Bearer ") ? token.slice(7) : token;

      const decode = jwt.verify(tokenString, env.JWT_ACCESS_SECRET);
      const sessionExists = await redis.exists(
        `session:${decode.id}:${decode.deviceId}`,
      );

      if (!sessionExists) {
        return next(
          new Error(`Authentication failed: Session expired or revoked`),
        );
      }

      socket.user = {
        id: decode.id,
        username: decode.username,
        deviceId: decode.deviceId,
      };

      next();
    } catch (err) {
      logger.warn(`Websocket authentication rejected: ${err.message}`);
      next(new Error("Authentication failed: Invalid token"));
    }
  });

  io.on("connection", async (socket) => {
    const userId = socket.user.id;
    logger.info(
      `Socket connected user: User [${socket.user.username}] on ID [${socket.id}]`,
    );

    await socket.join(`user:${userId}`);

    // Register event sub-handlers
    registerPresenceHandlers(io, socket);
    registerMessageHandlers(io, socket);
    registerTypingHandlers(io, socket);
    registerReceiptHandlers(io, socket);

    socket.on("disconnect", () => {
      logger.info(
        `Socket disconnected: Socket [${socket.id}] of user [${socket.user.username}]`,
      );
    });
  });
  return io;
};


const getIO = () => {
  if (!io){
    throw new Error(`Socket.io has not been initialized yet!`);
  }
  return io;
}


module.exports = { initSocket , getIO };