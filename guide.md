# 📞 Call History Implementation Guide

This step-by-step guide will walk you through implementing a **Call History** feature in your Real-Time Chat Application. By following this guide, you will add MongoDB call logging, backend API endpoints, and a frontend Call History sidebar UI.

---

## 🎯 Architecture & Data Flow Overview

```
 [User A]                    [Backend Server]                   [User B]
    │                               │                               │
    ├───── (call:initiate) ────────►│───── (call:incoming) ────────►│
    │                               │                               │
    ├───── (call:accept) ──────────►│─── Save Call Start Time ──────►│
    │                               │                               │
    ├───── (call:end) ─────────────►│─── Calculate Duration ────────►│
    │                               │    & Save Record to MongoDB   │
```

---

## 🛠️ Step 1: Create MongoDB Call Schema

Create a new file: `backend/src/model/Call.js`

```javascript
const mongoose = require("mongoose");

const callSchema = new mongoose.Schema(
  {
    callerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    receiverId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    callType: {
      type: String,
      enum: ["audio", "video"],
      required: true,
    },
    status: {
      type: String,
      enum: ["completed", "missed", "rejected"],
      required: true,
    },
    duration: {
      type: Number, // duration in seconds
      default: 0,
    },
    startedAt: {
      type: Date,
      default: null,
    },
    endedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index for efficient user call history queries
callSchema.index({ callerId: 1, createdAt: -1 });
callSchema.index({ receiverId: 1, createdAt: -1 });

module.exports = mongoose.model("Call", callSchema);
```

---

## 🛠️ Step 2: Complete Updated Socket Handler (`call.handler.js`)

Replace the contents of `backend/src/socket/handlers/call.handler.js` with this complete code:

```javascript
const crypto = require("crypto");
const logger = require("../../config/logger");
const { redis } = require("../../redis/client");
const Call = require("../../model/call");

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
  const currentUserId = socket.user?.id;

  if (!currentUserId) {
    logger.warn("Socket initialized without authenticated user context.");
    return;
  }

  // 1. INITIATE CALL
  socket.on("call:initiate", async (payload = {}) => {
    const { targetUserId, callType, offer } = payload;
    try {
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

      const callerActiveCall = await redis.get(getKeyUserCall(currentUserId));
      if (callerActiveCall) {
        return socket.emit("call:busy", { targetUserId, reason: "You are already in another call." });
      }

      const callId = `call_${crypto.randomUUID()}`;
      const lockAcquired = await redis.set(getKeyUserCall(targetUserId), callId, "NX", "EX", CALL_TTL_SECONDS);

      if (!lockAcquired) {
        return socket.emit("call:busy", { targetUserId, reason: "User is currently busy in another call." });
      }

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

      io.to(`user:${targetUserId}`).emit("call:incoming", {
        callId,
        caller: { id: socket.user.id, username: socket.user.username },
        callType,
        offer,
      });

      logger.info(`Call initiated: ${callId} [${currentUserId} -> ${targetUserId}]`);
    } catch (error) {
      logger.error(`Error in call:initiate: ${error.message}`);
      socket.emit("call:error", { message: "Internal server error initiating call." });
    }
  });

  // 2. ACCEPT CALL
  socket.on("call:accept", async (payload = {}) => {
    const { callId, targetUserId, answer } = payload;
    try {
      if (!callId || !targetUserId || !answer || !answer.sdp) {
        return socket.emit("call:error", { message: "Invalid call:accept payload." });
      }

      const callData = await getCallState(callId);
      if (!callData) return socket.emit("call:error", { message: "Call session expired or non-existent." });
      if (callData.receiverId !== currentUserId || callData.callerId !== targetUserId) {
        return socket.emit("call:error", { message: "Unauthorized call acceptance attempt." });
      }

      callData.status = "active";
      callData.acceptedAt = Date.now();
      await redis.set(getKeyCall(callId), JSON.stringify(callData), "EX", CALL_TTL_SECONDS);

      io.to(`user:${targetUserId}`).emit("call:accepted", {
        callId,
        answer,
        responderId: currentUserId,
      });

      logger.info(`Call accepted: ${callId} by receiver [${currentUserId}]`);
    } catch (error) {
      logger.error(`Error in call:accept: ${error.message}`);
    }
  });

  // 3. REJECT CALL
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
    } catch (error) {
      logger.error(`Error in call:reject: ${error.message}`);
    }
  });

  // 4. ICE CANDIDATE
  socket.on("call:ice-candidate", async (payload = {}) => {
    const { targetUserId, candidate } = payload;
    try {
      if (!targetUserId || !candidate) return;
      io.to(`user:${targetUserId}`).emit("call:ice-candidate", { senderId: currentUserId, candidate });
    } catch (error) {
      logger.error(`Error in call:ice-candidate: ${error.message}`);
    }
  });

  // 5. TOGGLE MEDIA
  socket.on("call:toggle-media", async (payload = {}) => {
    const { targetUserId, mediaType, enabled } = payload;
    try {
      if (!targetUserId || !["audio", "video"].includes(mediaType)) return;
      io.to(`user:${targetUserId}`).emit("call:toggle-media", { senderId: currentUserId, mediaType, enabled: Boolean(enabled) });
    } catch (error) {
      logger.error(`Error in call:toggle-media: ${error.message}`);
    }
  });

  // 6. END CALL
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
        const peerId = callData.callerId === currentUserId ? callData.receiverId : callData.callerId;
        await recordCallLog(callData);
        await cleanupCallRedis(callId, callData.callerId, callData.receiverId);
        if (peerId) {
          io.to(`user:${peerId}`).emit("call:ended", { callId, endedBy: currentUserId });
        }
      } else {
        await cleanupCallRedis(callId, currentUserId, targetUserId);
      }
    } catch (error) {
      logger.error(`Error in call:end: ${error.message}`);
    }
  });

  // 7. DISCONNECT CLEANUP
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
          io.to(`user:${peerId}`).emit("call:ended", { callId: activeCallId, endedBy: currentUserId, reason: "Peer disconnected unexpectedly" });
        }
      }
    } catch (error) {
      logger.error(`Error handling call disconnect cleanup: ${error.message}`);
    }
  });
};

module.exports = registerCallHandlers;
```

---

## 🛠️ Step 3: Backend Service, Controller & API Routes

In accordance with our modular 3-layer architecture (`routes` ➔ `controller` ➔ `service`), create the following files under `backend/src/modules/calls/`:

### 1. Create `backend/src/modules/calls/call.service.js`

```javascript
const Call = require("../../model/call");

/**
 * Fetch paginated call logs for a user
 */
const getCallHistory = async (userId, page = 1, limit = 20) => {
  const pageNum = parseInt(page, 10) || 1;
  const limitNum = parseInt(limit, 10) || 20;
  const skip = (pageNum - 1) * limitNum;

  const query = {
    $or: [{ callerId: userId }, { receiverId: userId }],
  };

  const [calls, total] = await Promise.all([
    Call.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum)
      .populate("callerId", "username displayName avatarUrl")
      .populate("receiverId", "username displayName avatarUrl")
      .lean(),
    Call.countDocuments(query),
  ]);

  return {
    items: calls,
    pagination: {
      page: pageNum,
      limit: limitNum,
      total,
      pages: Math.ceil(total / limitNum),
    },
  };
};

module.exports = {
  getCallHistory,
};
```

### 2. Create `backend/src/modules/calls/call.controller.js`

```javascript
const callService = require("./call.service");

/**
 * Get Paginated Call History for Authenticated User
 * GET /api/calls/history?page=1&limit=20
 */
const getCallHistory = async (req, res) => {
  try {
    const currentUserId = req.user.id || req.user._id;
    const { page, limit } = req.query;

    const data = await callService.getCallHistory(currentUserId, page, limit);

    return res.status(200).json({
      success: true,
      data,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Error fetching call history",
      error: error.message,
    });
  }
};

module.exports = {
  getCallHistory,
};
```

### 2. Create `backend/src/modules/calls/call.routes.js`

```javascript
const express = require("express");
const { getCallHistory } = require("./call.controller");
const { protect } = require("../../middleware/auth.middleware");

const router = express.Router();

router.use(protect);
router.get("/history", getCallHistory);

module.exports = router;
```

### 3. Register Route in `backend/src/routes/index.js`

```javascript
const callRoutes = require("../modules/calls/call.routes");

// Add route definition
router.use("/calls", callRoutes);
```

---

## 🛠️ Step 4: Frontend API & Data Types

### 1. Update Types in `frontend/src/types/call.ts`

Add call history interfaces:

```typescript
export interface CallHistoryUser {
  _id: string;
  username: string;
  displayName?: string;
  avatarUrl?: string;
}

export interface CallHistoryItem {
  _id: string;
  callerId: CallHistoryUser;
  receiverId: CallHistoryUser;
  callType: 'audio' | 'video';
  status: 'completed' | 'missed' | 'rejected';
  duration: number;
  startedAt?: string;
  endedAt: string;
  createdAt: string;
}
```

### 2. Create API Client in `frontend/src/api/calls.api.ts`

```typescript
import axios from 'axios';
import { API_URL } from '../lib/constants';
import { useAuthStore } from '../store/auth.store';
import type { CallHistoryItem } from '../types/call';

export const callsApi = {
  async getHistory(page = 1, limit = 20) {
    const token = useAuthStore.getState().accessToken;
    const { data } = await axios.get(`${API_URL}/calls/history`, {
      params: { page, limit },
      headers: { Authorization: `Bearer ${token}` },
    });
    return data.data as {
      items: CallHistoryItem[];
      pagination: { page: number; limit: number; total: number; pages: number };
    };
  },
};
```

---

## 🛠️ Step 5: Create Frontend Call History Sidebar Component

Create file: `frontend/src/components/chat/CallHistorySidebar.tsx`

```tsx
import { useQuery } from '@tanstack/react-query';
import { Phone, Video, PhoneIncoming, PhoneOutgoing, PhoneMissed, Loader2 } from 'lucide-react';
import { callsApi } from '../../api/calls.api';
import { useAuthStore } from '../../store/auth.store';
import { useWebRTC } from '../../hooks/useWebRTC';
import { formatConversationDate } from '../../lib/format';

function formatCallDuration(seconds: number): string {
  if (!seconds || seconds <= 0) return '0s';
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  if (mins > 0) return `${mins}m ${secs}s`;
  return `${secs}s`;
}

export function CallHistorySidebar() {
  const currentUserId = useAuthStore((s) => s.user?._id || (s.user as any)?.id)?.toString();
  const { initiateCall } = useWebRTC();

  const { data, isLoading, error } = useQuery({
    queryKey: ['call-history'],
    queryFn: () => callsApi.getHistory(1, 30),
    staleTime: 30 * 1000,
  });

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center p-8 text-zinc-500">
        <Loader2 className="w-6 h-6 animate-spin text-[#5D5FEF]" />
      </div>
    );
  }

  if (error || !data?.items || data.items.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-zinc-400">
        <Phone className="w-12 h-12 stroke-1 text-zinc-600 mb-3" />
        <h4 className="font-semibold text-white">No Call History</h4>
        <p className="text-xs text-zinc-500 mt-1">Your recent audio and video calls will appear here.</p>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto divide-y divide-white/5 p-2">
      {data.items.map((call) => {
        const isCaller = call.callerId?._id?.toString() === currentUserId;
        const peer = isCaller ? call.receiverId : call.callerId;
        const isMissed = call.status === 'missed';

        return (
          <div
            key={call._id}
            className="flex items-center justify-between p-3 rounded-2xl hover:bg-white/5 transition-colors group"
          >
            {/* User Info & Call Icon */}
            <div className="flex items-center gap-3 min-w-0">
              <div className="relative flex-shrink-0">
                <div className="w-10 h-10 rounded-full bg-slate-800 border border-white/10 flex items-center justify-center text-white font-bold text-xs overflow-hidden">
                  {peer?.avatarUrl ? (
                    <img src={peer.avatarUrl} alt={peer.username} className="w-full h-full object-cover" />
                  ) : (
                    <span>{peer?.username?.slice(0, 2).toUpperCase() || 'US'}</span>
                  )}
                </div>
              </div>

              <div className="min-w-0">
                <h4 className="text-sm font-semibold text-white truncate">
                  {peer?.displayName || peer?.username || 'Unknown User'}
                </h4>
                <div className="flex items-center gap-1.5 text-xs mt-0.5">
                  {isMissed ? (
                    <PhoneMissed className="w-3.5 h-3.5 text-rose-500" />
                  ) : isCaller ? (
                    <PhoneOutgoing className="w-3.5 h-3.5 text-emerald-400" />
                  ) : (
                    <PhoneIncoming className="w-3.5 h-3.5 text-blue-400" />
                  )}

                  <span className={isMissed ? 'text-rose-400 font-medium' : 'text-zinc-400'}>
                    {call.callType === 'video' ? 'Video' : 'Audio'} Call
                    {call.duration > 0 && ` • ${formatCallDuration(call.duration)}`}
                  </span>
                </div>
                <p className="text-[10px] text-zinc-500 mt-0.5">{formatConversationDate(call.createdAt)}</p>
              </div>
            </div>

            {/* Quick Redial Buttons */}
            {peer && (
              <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={() =>
                    initiateCall(
                      {
                        id: peer._id,
                        username: peer.username,
                        displayName: peer.displayName,
                        avatarUrl: peer.avatarUrl,
                      },
                      call.callType
                    )
                  }
                  className="p-2 rounded-xl bg-white/5 hover:bg-emerald-600/20 hover:text-emerald-400 text-zinc-400 transition-all"
                  title={`Redial ${call.callType} call`}
                >
                  {call.callType === 'video' ? <Video className="w-4 h-4" /> : <Phone className="w-4 h-4" />}
                </button>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
```

---

## 🛠️ Step 6: Add Calls Tab to Navigation Sidebar

In `frontend/src/components/chat/ChatSidebar.tsx`, add a Phone/Calls tab state:

```tsx
// Inside ChatSidebar component state
const [activeTab, setActiveTab] = useState<'chats' | 'notifications' | 'calls'>('chats');
```

Render `<CallHistorySidebar />` when `activeTab === 'calls'`.

---

## ✅ Summary Checklist for Self-Implementation

- [ ] Create `backend/src/model/Call.js`
- [ ] Add `recordCallLog` helper to `backend/src/socket/handlers/call.handler.js`
- [ ] Create `backend/src/modules/calls/call.controller.js` & `call.routes.js`
- [ ] Register `/api/calls` in `backend/src/routes/index.js`
- [ ] Add history interfaces to `frontend/src/types/call.ts`
- [ ] Create `frontend/src/api/calls.api.ts`
- [ ] Create `frontend/src/components/chat/CallHistorySidebar.tsx`
- [ ] Add Calls tab to `ChatSidebar.tsx`

Happy Coding! 🚀
