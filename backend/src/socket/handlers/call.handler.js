const crypto = require("crypto");
const logger = require("../../config/logger");
const { redis } = require("../../redis/client");
const Call = require("../../model/call");
const User = require("../../model/User");

/**
 * Redis Key Helpers & Expiry Constants
 */
const CALL_TTL_SECONDS = 3600; // 1 Hour TTL safety fallback
const getKeyCall = (callId) => `call:${callId}`;
const getKeyUserCall = (userId) => `user:call:${userId}`;

/**
 * Helper to clean up Redis state for a call atomically
 */
const cleanupCallRedis = async (callId, callerId, receiverId) => {
  try {
    const keysToDelete = [];
    if (callId) keysToDelete.push(getKeyCall(callId));
    if (callerId) keysToDelete.push(getKeyUserCall(callerId));
    if (receiverId) keysToDelete.push(getKeyUserCall(receiverId));

    if (keysToDelete.length > 0) {
      await redis.del(...keysToDelete);
    }
  } catch (error) {
    logger.error(`Failed to cleanup Redis call state: ${error.message}`);
  }
};

/**
 * Helper to parse Redis JSON safely
 */
const getCallState = async (callId) => {
  if (!callId) return null;
  const data = await redis.get(getKeyCall(callId));
  if (!data) return null;
  try {
    return JSON.parse(data);
  } catch {
    return null;
  }
};

/**
 * Helper to record completed, missed, or rejected call to MongoDB
 */
const recordCallLog = async (callData, statusOverride) => {
  if (!callData || !callData.callerId || !callData.receiverId) return;

  try {
    const now = Date.now();
    const startedAt = callData.acceptedAt ? new Date(callData.acceptedAt) : null;
    const duration = callData.acceptedAt ? Math.round((now - callData.acceptedAt) / 1000) : 0;
    const finalStatus = statusOverride || (callData.acceptedAt ? "completed" : "missed");

    await Call.create({
      callerId: callData.callerId,
      receiverId: callData.receiverId,
      callType: callData.callType || "audio",
      status: finalStatus,
      duration,
      startedAt,
      endedAt: new Date(now),
    });
    logger.info(`Recorded Call Log: ${finalStatus} [${callData.callerId} -> ${callData.receiverId}] duration: ${duration}s`);
  } catch (err) {
    logger.error(`Failed to record call log in MongoDB: ${err.message}`);
  }
};

const registerCallHandlers = (io, socket) => {
  const currentUserId = (socket.user?.id || socket.user?._id)?.toString();

  if (!currentUserId) {
    logger.warn("Socket initialized without authenticated user context.");
    return;
  }

  // ==========================================
  // 1. INITIATE CALL (Atomic & Race-Free)
  // ==========================================
  socket.on("call:initiate", async (payload = {}) => {
    const { targetUserId, callType, offer } = payload;

    try {
      // Input Payload Validation
      if (!targetUserId || typeof targetUserId !== "string") {
        return socket.emit("call:error", { message: "Invalid or missing targetUserId." });
      }

      if (targetUserId === currentUserId) {
        return socket.emit("call:error", { message: "You cannot call yourself." });
      }

      if (!callType || !["audio", "video"].includes(callType)) {
        return socket.emit("call:error", { message: "Invalid callType. Must be 'audio' or 'video'." });
      }

      if (!offer || typeof offer !== "object" || !offer.sdp || !offer.type) {
        return socket.emit("call:error", { message: "Invalid SDP offer structure." });
      }

      // Check if caller is already in an active call
      const callerActiveCall = await redis.get(getKeyUserCall(currentUserId));
      if (callerActiveCall) {
        return socket.emit("call:busy", {
          targetUserId,
          reason: "You are already in another call.",
        });
      }

      // Generate cryptographically secure Call ID
      const callId = `call_${crypto.randomUUID()}`;

      // ATOMIC RACE-CONDITION PREVENTION:
      const lockAcquired = await redis.set(
        getKeyUserCall(targetUserId),
        callId,
        "NX",
        "EX",
        CALL_TTL_SECONDS
      );

      if (!lockAcquired) {
        return socket.emit("call:busy", {
          targetUserId,
          reason: "User is currently busy in another call.",
        });
      }

      // Set caller's lock & call session object in Redis
      await Promise.all([
        redis.set(getKeyUserCall(currentUserId), callId, "EX", CALL_TTL_SECONDS),
        redis.set(
          getKeyCall(callId),
          JSON.stringify({
            callId,
            callerId: currentUserId,
            receiverId: targetUserId,
            callType,
            status: "ringing",
            createdAt: Date.now(),
          }),
          "EX",
          CALL_TTL_SECONDS
        ),
      ]);

      // Notify caller of the server-issued callId (used for ICE validation)
      socket.emit("call:ringing", {
        callId,
        targetUserId,
      });

      // Fetch caller profile so the receiver sees display name & avatar
      const callerProfile = await User.findById(currentUserId)
        .select("username displayName avatarUrl")
        .lean()
        .catch(() => null);

      // Emit incoming call event to target user's socket room
      io.to(`user:${targetUserId}`).emit("call:incoming", {
        callId,
        caller: {
          id: socket.user.id,
          username: callerProfile?.username || socket.user.username,
          displayName: callerProfile?.displayName || "",
          avatarUrl: callerProfile?.avatarUrl || "",
        },
        callType,
        offer,
      });

      logger.info(`Call initiated: ${callId} [${currentUserId} -> ${targetUserId}]`);
    } catch (error) {
      logger.error(`Error in call:initiate: ${error.message}`);
      socket.emit("call:error", { message: "Internal server error initiating call." });
    }
  });

  // ==========================================
  // 2. ACCEPT CALL
  // ==========================================
  socket.on("call:accept", async (payload = {}) => {
    const { callId, targetUserId, answer } = payload;

    try {
      if (!callId || !targetUserId || !answer || !answer.sdp) {
        return socket.emit("call:error", { message: "Invalid call:accept payload." });
      }

      const callData = await getCallState(callId);

      if (!callData) {
        return socket.emit("call:error", { message: "Call session expired or non-existent." });
      }

      if (callData.receiverId !== currentUserId || callData.callerId !== targetUserId) {
        return socket.emit("call:error", { message: "Unauthorized call acceptance attempt." });
      }

      if (callData.status !== "ringing") {
        return socket.emit("call:error", { message: "Call cannot be accepted in its current state." });
      }

      // Update call status to active & store acceptance timestamp for duration calculation
      callData.status = "active";
      callData.acceptedAt = Date.now();
      await redis.set(getKeyCall(callId), JSON.stringify(callData), "EX", CALL_TTL_SECONDS);

      // Notify caller that call was accepted
      io.to(`user:${targetUserId}`).emit("call:accepted", {
        callId,
        answer,
        responderId: currentUserId,
      });

      logger.info(`Call accepted: ${callId} by receiver [${currentUserId}]`);
    } catch (error) {
      logger.error(`Error in call:accept: ${error.message}`);
      socket.emit("call:error", { message: "Internal server error accepting call." });
    }
  });

  // ==========================================
  // 3. REJECT CALL
  // ==========================================
  socket.on("call:reject", async (payload = {}) => {
    const { callId, targetUserId, reason } = payload;

    try {
      if (!callId || !targetUserId) return;

      const callData = await getCallState(callId);

      if (callData && (callData.callerId === currentUserId || callData.receiverId === currentUserId)) {
        await recordCallLog(callData, "rejected");
        await cleanupCallRedis(callId, callData.callerId, callData.receiverId);
      } else {
        await cleanupCallRedis(callId, currentUserId, targetUserId);
      }

      io.to(`user:${targetUserId}`).emit("call:rejected", {
        callId,
        rejectorId: currentUserId,
        reason: reason || "Call rejected",
      });

      logger.info(`Call rejected: ${callId} by [${currentUserId}]`);
    } catch (error) {
      logger.error(`Error in call:reject: ${error.message}`);
    }
  });

  // ==========================================
  // 4. ICE CANDIDATE EXCHANGE
  // ==========================================
  socket.on("call:ice-candidate", async (payload = {}) => {
    const { targetUserId, candidate, callId } = payload;

    try {
      if (!targetUserId || !candidate) return;

      if (callId) {
        const callData = await getCallState(callId);
        if (!callData) return;

        const isParticipant = callData.callerId === currentUserId || callData.receiverId === currentUserId;
        if (!isParticipant) {
          logger.warn(`Unauthorized ICE candidate attempt from user ${currentUserId}`);
          return;
        }
      }

      io.to(`user:${targetUserId}`).emit("call:ice-candidate", {
        senderId: currentUserId,
        candidate,
      });
    } catch (error) {
      logger.error(`Error in call:ice-candidate: ${error.message}`);
    }
  });

  // ==========================================
  // 5. TOGGLE MEDIA (Mute / Camera Toggle)
  // ==========================================
  socket.on("call:toggle-media", async (payload = {}) => {
    const { targetUserId, mediaType, enabled } = payload;

    try {
      if (!targetUserId || !["audio", "video"].includes(mediaType)) return;

      io.to(`user:${targetUserId}`).emit("call:toggle-media", {
        senderId: currentUserId,
        mediaType,
        enabled: Boolean(enabled),
      });
    } catch (error) {
      logger.error(`Error in call:toggle-media: ${error.message}`);
    }
  });

  // ==========================================
  // 6. END CALL
  // ==========================================
  socket.on("call:end", async (payload = {}) => {
    const { callId, targetUserId } = payload;

    try {
      if (!callId) {
        const activeCallId = await redis.get(getKeyUserCall(currentUserId));
        if (activeCallId) {
          const callData = await getCallState(activeCallId);
          if (callData) {
            const peerId = callData.callerId === currentUserId ? callData.receiverId : callData.callerId;
            await recordCallLog(callData);
            await cleanupCallRedis(activeCallId, callData.callerId, callData.receiverId);
            io.to(`user:${peerId}`).emit("call:ended", { callId: activeCallId, endedBy: currentUserId });
          }
        }
        return;
      }

      const callData = await getCallState(callId);

      if (callData) {
        const isParticipant = callData.callerId === currentUserId || callData.receiverId === currentUserId;
        if (!isParticipant) {
          logger.warn(`Unauthorized call:end attempt by user [${currentUserId}] on call [${callId}]`);
          return;
        }

        const peerId = callData.callerId === currentUserId ? callData.receiverId : callData.callerId;
        await recordCallLog(callData);
        await cleanupCallRedis(callId, callData.callerId, callData.receiverId);

        if (peerId) {
          io.to(`user:${peerId}`).emit("call:ended", {
            callId,
            endedBy: currentUserId,
          });
        }
      } else {
        await cleanupCallRedis(callId, currentUserId, targetUserId);
        if (targetUserId) {
          io.to(`user:${targetUserId}`).emit("call:ended", {
            callId,
            endedBy: currentUserId,
          });
        }
      }

      logger.info(`Call ended: ${callId} by [${currentUserId}]`);
    } catch (error) {
      logger.error(`Error in call:end: ${error.message}`);
    }
  });

  // ==========================================
  // 7. UNEXPECTED DISCONNECT CLEANUP
  // ==========================================
  socket.on("disconnect", async () => {
    try {
      const activeCallId = await redis.get(getKeyUserCall(currentUserId));
      if (!activeCallId) return;

      const callData = await getCallState(activeCallId);

      if (callData) {
        const peerId = callData.callerId === currentUserId ? callData.receiverId : callData.callerId;
        await recordCallLog(callData);
        await cleanupCallRedis(activeCallId, callData.callerId, callData.receiverId);

        if (peerId) {
          io.to(`user:${peerId}`).emit("call:ended", {
            callId: activeCallId,
            endedBy: currentUserId,
            reason: "Peer disconnected unexpectedly",
          });
        }

        logger.info(`Cleaned up call [${activeCallId}] due to user [${currentUserId}] socket disconnect.`);
      }
    } catch (error) {
      logger.error(`Error handling call disconnect cleanup for user [${currentUserId}]: ${error.message}`);
    }
  });
};

module.exports = registerCallHandlers;
