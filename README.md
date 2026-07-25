<div align="center">

# ⚡ Real-Time Chat Application Engine

> **A high-performance, enterprise-ready real-time chatting backend infrastructure.**  
> Built with Node.js, Express, Socket.io, MongoDB, Redis Pub/Sub, and BullMQ.

[![Node.js](https://img.shields.io/badge/Node.js-v18+-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)](https://nodejs.org/)
[![Express](https://img.shields.io/badge/Express-v5.0-000000?style=for-the-badge&logo=express&logoColor=white)](https://expressjs.com/)
[![Socket.io](https://img.shields.io/badge/Socket.io-v4.8-010101?style=for-the-badge&logo=socketdotio&logoColor=white)](https://socket.io/)
[![MongoDB](https://img.shields.io/badge/MongoDB-v9.0-47A248?style=for-the-badge&logo=mongodb&logoColor=white)](https://www.mongodb.com/)
[![Redis](https://img.shields.io/badge/Redis-v6.0+-DC382D?style=for-the-badge&logo=redis&logoColor=white)](https://redis.io/)
[![License: ISC](https://img.shields.io/badge/License-ISC-blue.svg?style=for-the-badge)](LICENSE)

</div>

---

## 📌 Overview

This repository powers a robust, scalable backend architecture for real-time messaging applications. Designed for high concurrency and horizontal scaling, it features multi-device session management, real-time presence & typing state synchronization, offloaded background workers via BullMQ, and Cloudinary media uploads.

---

## 🔥 Key Features

| Feature | Description |
| :--- | :--- |
| **🔐 Secure Authentication** | JWT access & refresh token rotation, device-bound sessions, password resets, and email verification. |
| **⚡ Real-Time Messaging** | Sub-second message delivery via Socket.io, with Redis Pub/Sub adapter for scaling across instances. |
| **👥 Conversations & Groups** | Direct 1-on-1 chats and group management with granular role-based permissions (Admin/Member). |
| **🟢 Live Presence & Typing** | Heartbeat-based online/offline status tracking, real-time typing indicators, and read receipts (`delivered`, `read`). |
| **📨 Background Queues** | Offloads asynchronous tasks (email verification, push notifications) to BullMQ Redis workers. |
| **☁️ Cloud Attachments** | Secure browser-to-cloud signed upload URLs via Cloudinary for images, videos, audio, and documents. |
| **🛡️ Rate Limiting & Security** | Protection against brute-force attacks using dynamic rate limiters, Helmet security headers, and CORS control. |
| **📊 Logging & Observability** | Centralized structured logging with Winston Daily Rotate File and Morgan HTTP request streaming. |

---

## 🛠️ Tech Stack

- **Core Framework:** Node.js, Express.js (v5)
- **Database & ODM:** MongoDB, Mongoose (v9)
- **Caching & Pub/Sub:** Redis, IoRedis, `@socket.io/redis-adapter`
- **Real-Time Engine:** Socket.io (v4)
- **Queue System:** BullMQ
- **Media Engine:** Cloudinary API
- **Validation & Security:** Zod, BcryptJS, JSONWebToken, Helmet
- **Email Delivery:** Nodemailer (Brevo / SMTP integration)

---

## 📂 Project Structure

```text
Real-Time Chat Application/
└── backend/
    ├── src/
    │   ├── app.js                   # Express middleware stack & route mounting
    │   ├── server.js                # HTTP server setup & database initialization
    │   ├── common/                  # Global AppError & response wrappers
    │   ├── config/                  # DB, Cloudinary, Zod env & logger configurations
    │   ├── middleware/              # Auth guard, Zod validation & rate limiters
    │   ├── model/                   # Mongoose schemas (User, Message, Session, etc.)
    │   ├── modules/                 # Modular domain services (Auth, Chats, Messages, Files, Users)
    │   ├── queues/                  # BullMQ queues & asynchronous background workers
    │   ├── redis/                   # IoRedis client connection
    │   ├── routes/                  # Central API router (/api/v1)
    │   ├── socket/                  # Socket.io connection & event handlers
    │   └── utils/                   # Token, signature, and email utilities
    ├── .env.example                 # Environment variables template
    └── package.json                 # Node.js manifest & dependencies
```

---

## 📡 API Reference Overview

All REST endpoints are namespaced under `/api/v1`.

<details>
<summary><b>🔑 Authentication (<code>/api/v1/auth</code>)</b></summary>

<br>

| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :---: |
| `POST` | `/register` | Register a new user | ❌ |
| `POST` | `/login` | Login with device session creation | ❌ |
| `POST` | `/refresh` | Refresh access token | ❌ |
| `POST` | `/logout` | Revoke session & logout | ✅ |
| `GET` | `/verify-email/:token` | Verify user email address | ❌ |
| `POST` | `/resend-verification` | Resend verification email | ❌ |
| `POST` | `/forgot-password` | Request password reset token | ❌ |
| `POST` | `/reset-password/:token` | Complete password reset | ❌ |

</details>

<details>
<summary><b>👤 Users & Profiles (<code>/api/v1/users</code>)</b></summary>

<br>

| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :---: |
| `GET` | `/me` | Get current user profile | ✅ |
| `POST` | `/complete-profile` | Complete initial profile setup | ✅ |
| `PATCH` | `/profile` | Update profile & privacy settings | ✅ |
| `GET` | `/search` | Search users by username or email | ✅ |
| `GET` | `/:id` | Fetch public profile by user ID | ✅ |

</details>

<details>
<summary><b>💬 Chats & Groups (<code>/api/v1/chats</code>)</b></summary>

<br>

| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :---: |
| `POST` | `/` | Create direct or group conversation | ✅ |
| `GET` | `/` | List all conversations for active user | ✅ |
| `POST` | `/:conversationId/participants` | Add participant to group | ✅ |
| `DELETE` | `/:conversationId/participants/:userId` | Remove participant from group | ✅ |
| `DELETE` | `/:conversationId` | Delete group chat (Admin only) | ✅ |

</details>

<details>
<summary><b>✉️ Messages (<code>/api/v1/messages</code>)</b></summary>

<br>

| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :---: |
| `POST` | `/` | Send message to conversation | ✅ |
| `GET` | `/:conversationId` | Fetch message history with pagination | ✅ |
| `POST` | `/:id/react` | Add emoji reaction | ✅ |
| `DELETE` | `/:id/react` | Remove reaction | ✅ |
| `PATCH` | `/:id` | Edit message content | ✅ |
| `DELETE` | `/:id` | Soft delete message | ✅ |

</details>

<details>
<summary><b>📁 Files & Media (<code>/api/v1/files</code>)</b></summary>

<br>

| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :---: |
| `GET` | `/sign` | Generate Cloudinary signed upload URL | ✅ |
| `POST` | `/verify` | Save uploaded file metadata | ✅ |
| `POST` | `/webhook/scan` | Cloudinary scan notification webhook | ❌ |

</details>

---

## ⚡ Socket.io Events

Connect to WebSockets using Bearer authentication:
```javascript
const socket = io("http://localhost:3000", {
  auth: { token: "Bearer YOUR_ACCESS_TOKEN" }
});
```

| Event Category | Socket Event Names | Description |
| :--- | :--- | :--- |
| **Presence** | `user_online`, `user_offline`, `heartbeat` | Real-time status tracking across user rooms |
| **Messaging** | `send_message`, `new_message` | Sub-second real-time message dispatches |
| **Typing** | `typing_start`, `typing_stop` | Live typing state synchronization |
| **Receipts** | `message_delivered`, `message_read` | Real-time delivery and read status updates |

---

## 🚀 Quick Start Guide

### 1. Prerequisites
Ensure you have the following installed:
- **Node.js** `v18.x` or higher
- **MongoDB** `v6.0+` (Local or MongoDB Atlas)
- **Redis** `v6.0+` (Local or Redis Cloud)

### 2. Clone & Install
```bash
git clone https://github.com/buildwithrishabh/Real-Time-Chatting-Application-.git
cd "Real-Time Chat Application/backend"
npm install
```

### 3. Environment Setup
Create a `.env` file inside the `backend` directory using the provided template:
```bash
cp .env.example .env
```

Fill in your configuration details:
```env
PORT=3000
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/chat-app
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=

JWT_ACCESS_SECRET=your_jwt_access_secret_min_8_chars
JWT_REFRESH_SECRET=your_jwt_refresh_secret_min_8_chars
COOKIE_SECRET=your_cookie_secret_min_8_chars

CLOUDINARY_CLOUD_NAME=your_cloudinary_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret

SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USER=your_smtp_username
SMTP_PASS=your_smtp_password
SMTP_FROM=noreply@chatapp.com
```

### 4. Run Server & Workers

**Development Mode (Hot-Reloading):**
```bash
npm run dev
```

**Production Mode:**
```bash
npm start
```

---

## 📜 License

Distributed under the [ISC License](LICENSE).
