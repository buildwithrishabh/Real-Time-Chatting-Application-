const { redis } = require("../../redis/client");
const logger = require("../../config/logger");

module.exports = (io, socket) => {
  const userId = socket.user.id;
  const presenceKey = `presence:status:${userId}`;
  const socketKey = `presence:sockets:${userId}`;
  const lastSeenKey = `presence:lastseen:${userId}`;

  const handleConnectPresence = async () => {
    try {
      await redis.sadd(socketKey, socket.id);

      await redis.set(presenceKey, "online");
      await redis.del(lastSeenKey);

      socket.broadcast.emit("user:status_change", {
        userId,
        status: "online",
      });
      
      logger.debug(`Presence: User [${socket.user.username}] marked online`);
    } catch (err) {
      logger.error(`Presence connection error: ${err.message}`);
    }
  };

  socket.on("disconnect" , async () => {
    try {
      await redis.srem(socketKey , socket.id);

      const remainingSockets = await redis.scard(socketKey);
      
      // IF no active socket connections remains , mart the user offline
      if (remainingSockets === 0){
        const lastseen = new Date();
        await redis.set(presenceKey , "offline");
        await redis.set(lastSeenKey , lastseen.toISOString());

        socket.broadcast.emit("user:status_change" , {
          userId,
          status: "offline",
          lastSeenAt: lastseen
        });

        logger.debug(`Presence: User [${socket.user.username}] marked OFFLINE`)
      }
    } catch (err){
        logger.error(`Presence disconnect error: ${err.message}`);
    }
  });

  handleConnectPresence();
};