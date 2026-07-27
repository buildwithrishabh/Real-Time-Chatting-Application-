# Backend Gap Analysis & Fix Guide

> Complete guide documenting all missing features, bugs, and inconsistencies found
> in the Real-Time Chat Application backend, along with their fixes.

---

## Table of Contents

1. [Block User Feature (Missing)](#1-block-user-feature-missing)
2. [Read Receipts Not Persisted (Bug)](#2-read-receipts-not-persisted-bug)
3. [Group Delete Doesn't Cascade (Bug)](#3-group-delete-doesnt-cascade-bug)
4. [No Self-Participant Check (Bug)](#4-no-self-participant-check-bug)
5. [Socket Message Handler No Participant Check (Bug)](#5-socket-message-handler-no-participant-check-bug)
6. [Inconsistent StatusCodes Import (Code Smell)](#6-inconsistent-statuscodes-import-code-smell)

---

## 1. Block User Feature (Missing)

**Model exists at:** `backend/src/model/BlockedUser.js`
**Status:** Model defined, no routes/controllers/services implemented.

### What Needs to Be Built

#### 1.1 Repository — `backend/src/modules/users/block.repository.js`

```js
const BlockedUser = require("../../model/BlockedUser");

const blockUser = async (blockerId, blockedId) => {
  return BlockedUser.findOneAndUpdate(
    { blockerId, blockedId },
    { $setOnInsert: { blockerId, blockedId } },
    { upsert: true, new: true },
  );
};

const unblockUser = async (blockerId, blockedId) => {
  return BlockedUser.findOneAndDelete({ blockerId, blockedId });
};

const isBlocked = async (blockerId, blockedId) => {
  const record = await BlockedUser.exists({ blockerId, blockedId });
  return !!record;
};

const getBlockedUsers = async (blockerId) => {
  return BlockedUser.find({ blockerId })
    .populate("blockedId", "username displayName avatarUrl")
    .sort({ createdAt: -1 })
    .lean();
};

const isEitherBlocked = async (userId1, userId2) => {
  const record = await BlockedUser.exists({
    $or: [
      { blockerId: userId1, blockedId: userId2 },
      { blockerId: userId2, blockedId: userId1 },
    ],
  });
  return !!record;
};

module.exports = {
  blockUser,
  unblockUser,
  isBlocked,
  getBlockedUsers,
  isEitherBlocked,
};
```

#### 1.2 Service — `backend/src/modules/users/block.service.js`

```js
const blockRepository = require("./block.repository");
const { AppError, StatusCodes } = require("../../common/appError");

const blockUser = async (blockerId, targetUserId) => {
  if (blockerId.toString() === targetUserId.toString()) {
    throw new AppError("You cannot block yourself", StatusCodes.BAD_REQUEST);
  }

  const alreadyBlocked = await blockRepository.isBlocked(
    blockerId,
    targetUserId,
  );
  if (alreadyBlocked) {
    throw new AppError("User is already blocked", StatusCodes.BAD_REQUEST);
  }

  const blocked = await blockRepository.blockUser(blockerId, targetUserId);
  return blocked;
};

const unblockUser = async (blockerId, targetUserId) => {
  const result = await blockRepository.unblockUser(blockerId, targetUserId);
  if (!result) {
    throw new AppError("User is not blocked", StatusCodes.BAD_REQUEST);
  }

  return { success: true, message: "User unblocked successfully" };
};

const getBlockedUsers = async (userId) => {
  return blockRepository.getBlockedUsers(userId);
};

module.exports = { blockUser, unblockUser, getBlockedUsers };
```

#### 1.3 Controller — `backend/src/modules/users/block.controller.js`

```js
const blockService = require("./block.service");
const { StatusCodes } = require("../../common/appError");

const block = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const result = await blockService.blockUser(req.user.id, userId);
    res.status(StatusCodes.OK).json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
};

const unblock = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const result = await blockService.unblockUser(req.user.id, userId);
    res.status(StatusCodes.OK).json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
};

const listBlocked = async (req, res, next) => {
  try {
    const users = await blockService.getBlockedUsers(req.user.id);
    res.status(StatusCodes.OK).json({ success: true, data: { users } });
  } catch (err) {
    next(err);
  }
};

module.exports = { block, unblock, listBlocked };
```

#### 1.4 Routes — Add to `backend/src/modules/users/user.routes.js`

```js
const blockController = require("./block.controller");

// Add these routes after existing routes
router.post("/:userId/block", blockController.block);
router.delete("/:userId/block", blockController.unblock);
router.get("/blocked", blockController.listBlocked);
```

> **Important:** Add the `GET /blocked` route BEFORE `GET /:id` to avoid route conflict.

#### 1.5 Integration Points

After building the block feature, integrate it into these locations:

- **`chat.service.js` → `createChat`**: Check if blocker/blocked before creating private chat
- **`message.service.js` → `sendMessage`**: Check if sender is blocked by any participant
- **`user.repository.js` → `findUsersByQuery`**: Filter out blocked users from search results

---

## 2. Read Receipts Not Persisted (Bug)

**File:** `backend/src/socket/handlers/receipt.handler.js`
**Problem:** Read receipts are broadcast via Socket but `Participant.lastReadMessageId`
and `Participant.unreadCount` are **never updated** in MongoDB.

### Current Code (Broken)

```js
// receipt.handler.js — only broadcasts, doesn't persist
socket.on("message:read", async ({ conversationId, messageId }) => {
  socket.to(`chat:room:${conversationId}`).emit("receipt:updated", { ... });
});
```

### Fixed Code

```js
const logger = require("../../config/logger");
const Participant = require("../../model/Participant");
const Message = require("../../model/Message");

module.exports = (io, socket) => {
  const userId = socket.user.id;

  socket.on("message:read", async ({ conversationId, messageId }) => {
    if (!conversationId || !messageId) return;

    try {
      // 1. Persist the read receipt in DB
      const participant = await Participant.findOneAndUpdate(
        { conversationId, userId },
        {
          lastReadMessageId: messageId,
          unreadCount: 0,
        },
        { new: true },
      );

      // 2. Broadcast to room participants
      socket.to(`chat:room:${conversationId}`).emit("receipt:updated", {
        conversationId,
        userId,
        messageId,
        status: "read",
        timestamp: new Date(),
      });

      logger.debug(
        `Receipt: Message [${messageId}] marked READ by user [${socket.user.username}]`,
      );
    } catch (err) {
      logger.error(`Receipt update error: ${err.message}`);
    }
  });
};
```

#### 2.1 Also Update When Messages Are Fetched

In `message.controller.js` → `list`, after fetching messages, update the participant's
`lastReadMessageId` to the latest (first) message in the result:

```js
// In message.controller.js list function, after fetching messages:
if (messages.length > 0) {
  const latestMessageId = messages[0]._id; // Already sorted descending
  await Participant.findOneAndUpdate(
    { conversationId, userId: req.user.id },
    { lastReadMessageId: latestMessageId },
  );
}
```

---

## 3. Group Delete Doesn't Cascade (Bug)

**File:** `backend/src/modules/chats/chat.repository.js:82-85`
**Problem:** Deleting a conversation doesn't delete associated Messages or Files,
leaving orphaned data in MongoDB.

### Current Code (Broken)

```js
const deleteConversation = async (id) => {
  await Conversation.deleteOne({ _id: id });
  await Participant.deleteMany({ conversationId: id });
  // Messages and Files are NOT deleted
};
```

### Fixed Code

```js
const Message = require("../../model/Message");
const File = require("../../model/File");
const Notification = require("../../model/Notification");

const deleteConversation = async (id) => {
  // 1. Delete all messages in the conversation
  await Message.deleteMany({ conversationId: id });

  // 2. Delete all file records associated with the conversation
  await File.deleteMany({ conversationId: id });

  // 3. Delete all participants
  await Participant.deleteMany({ conversationId: id });

  // 4. Delete associated notifications
  await Notification.deleteMany({ chatId: id });

  // 5. Finally delete the conversation itself
  await Conversation.deleteOne({ _id: id });
};
```

> **Note:** This does NOT delete files from Cloudinary storage. If you want to
> clean up Cloudinary as well, iterate through File records and call
> `cloudinary.uploader.destroy(publicId)` before deleting from MongoDB.

---

## 4. No Self-Participant Check (Bug)

**File:** `backend/src/modules/chats/chat.service.js`
**Problem:** A user can create a private chat with themselves by passing their own
ID in `participantIds`.

### Fix — Add to `chat.service.js` → `createChat`

```js
const createChat = async (creatorId, { type, name, participantIds }) => {
  // NEW: Prevent self-chat
  if (participantIds.includes(creatorId.toString())) {
    throw new AppError(
      "You cannot create a conversation with yourself",
      StatusCodes.BAD_REQUEST,
    );
  }

  if (type === "private") {
    if (participantIds.length !== 1) {
      throw new AppError(
        "Direct message must have exactly one recipient",
        StatusCodes.BAD_REQUEST,
      );
    }
    // ... rest of existing code
  }
  // ... rest of existing code
};
```

### Also Add to `addParticipant`

```js
const addParticipant = async (adminId, conversationId, targetUserId) => {
  // NEW: Prevent adding yourself
  if (adminId.toString() === targetUserId.toString()) {
    throw new AppError(
      "You cannot add yourself to the conversation",
      StatusCodes.BAD_REQUEST,
    );
  }
  // ... rest of existing code
};
```

---

## 5. Socket Message Handler No Participant Check (Bug)

**File:** `backend/src/socket/handlers/message.handler.js`
**Problem:** The `message:send` socket handler does NOT verify that the socket user
is a participant in the conversation. Any authenticated socket user can send
messages to any conversation.

### Current Code (Vulnerable)

```js
socket.on("message:send", async (payload, callback) => {
  const { conversationId, content, fileId, tempId } = payload;
  // No participant check — goes straight to messageService.sendMessage
  const message = await messageService.sendMessage(socket.user.id, payload);
  // ...
});
```

### Why It Seems OK But Isn't

`messageService.sendMessage` does check `chatRepository.findParticipant()`, so the
DB-level check exists. However, the error handling in the socket handler catches it
and returns a generic error. The real fix is to **check early** and provide a clear
error before doing any work.

### Fixed Code

```js
const logger = require("../../config/logger");
const messageService = require("../../modules/messages/message.service");
const chatRepository = require("../../modules/chats/chat.repository");

module.exports = (io, socket) => {
  socket.on("room:join", async ({ conversationId }) => {
    if (!conversationId) return;
    await socket.join(`chat:room:${conversationId}`);
    logger.debug(
      `user [${socket.user.username}] joined room [${conversationId}]`,
    );
  });

  socket.on("room:leave", async ({ conversationId }) => {
    if (!conversationId) return;
    await socket.leave(`chat:room:${conversationId}`);
    logger.debug(
      `user [${socket.user.username}] left room: [${conversationId}]`,
    );
  });

  socket.on("message:send", async (payload, callback) => {
    const { conversationId, content, fileId, tempId } = payload;

    if (!conversationId || (!content && !fileId)) {
      if (typeof callback === "function") {
        callback({ success: false, error: "Invalid message payload" });
      }
      return;
    }

    try {
      // NEW: Early participant verification
      const isParticipant = await chatRepository.findParticipant(
        conversationId,
        socket.user.id,
      );

      if (!isParticipant) {
        if (typeof callback === "function") {
          callback({
            success: false,
            error: "You are not a participant in this conversation",
          });
        }
        return;
      }

      const message = await messageService.sendMessage(socket.user.id, payload);
      socket.to(`chat:room:${conversationId}`).emit("message:new", message);

      if (typeof callback === "function") {
        callback({
          success: true,
          data: {
            ...(message.toObject ? message.toObject() : message),
            tempId,
          },
        });
      }
    } catch (err) {
      logger.error(`Socket message:send error: ${err.message}`);
      if (typeof callback === "function") {
        callback({
          success: false,
          error: err.message || "Failed to send message",
        });
      }
    }
  });
};
```

---

## 6. Inconsistent StatusCodes Import (Code Smell)

**File:** `backend/src/modules/notifications/notification.controller.js:2`
**Problem:** Uses `require("http-status-codes")` directly instead of
`require("../../common/appError")` like every other controller.

### Current Code

```js
const { StatusCodes } = require("http-status-codes");
```

### Fix

```js
const { StatusCodes } = require("../../common/appError");
```

This keeps the import pattern consistent across all controllers. Both work
identically since `appError.js` re-exports `StatusCodes` from `http-status-codes`.

---

## Priority Order for Fixes

| Priority | Issue                                       | Type               | Effort  |
| -------- | ------------------------------------------- | ------------------ | ------- |
| **P0**   | Socket message handler no participant check | Security Bug       | Low     |
| **P0**   | Group delete doesn't cascade                | Data Integrity Bug | Low     |
| **P1**   | Read receipts not persisted                 | Feature Bug        | Medium  |
| **P1**   | No self-participant check                   | Validation Bug     | Low     |
| **P2**   | Block User feature                          | Missing Feature    | Medium  |
| **P3**   | Inconsistent StatusCodes import             | Code Smell         | Trivial |

---

## Quick Reference: All Files to Create

```
backend/src/modules/users/block.repository.js
backend/src/modules/users/block.service.js
backend/src/modules/users/block.controller.js
```

## Quick Reference: All Files to Modify

```
backend/src/modules/users/user.routes.js          → Add block routes
backend/src/socket/handlers/receipt.handler.js     → Persist read receipts
backend/src/socket/handlers/message.handler.js     → Add participant check
backend/src/modules/chats/chat.repository.js       → Cascade delete
backend/src/modules/chats/chat.service.js          → Self-participant check
backend/src/modules/notifications/notification.controller.js → Fix import
```
