<div align="center">

# ⚡ Real-Time Chat Application

> **A high-performance, enterprise-ready, full-stack real-time messaging application.**  
> Powered by a sleek **React 19 + TypeScript** frontend and a high-concurrency **Node.js + Socket.io + MongoDB + Redis Pub/Sub + BullMQ** backend.

<br />

[![React](https://img.shields.io/badge/React-v19.0-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-v6.0-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-v8.1-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vitejs.dev/)
[![TailwindCSS](https://img.shields.io/badge/Tailwind_CSS-v4.3-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![Node.js](https://img.shields.io/badge/Node.js-v18+-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)](https://nodejs.org/)
[![Express](https://img.shields.io/badge/Express-v5.0-000000?style=for-the-badge&logo=express&logoColor=white)](https://expressjs.com/)
[![Socket.io](https://img.shields.io/badge/Socket.io-v4.8-010101?style=for-the-badge&logo=socketdotio&logoColor=white)](https://socket.io/)
[![MongoDB](https://img.shields.io/badge/MongoDB-v9.0-47A248?style=for-the-badge&logo=mongodb&logoColor=white)](https://www.mongodb.com/)
[![Redis](https://img.shields.io/badge/Redis-v6.0+-DC382D?style=for-the-badge&logo=redis&logoColor=white)](https://redis.io/)
[![License: ISC](https://img.shields.io/badge/License-ISC-blue.svg?style=for-the-badge)](LICENSE)

</div>

---

## 📑 Table of Contents

- [📌 Overview](#-overview)
- [🔥 Key Features](#-key-features)
- [🏗️ System Architecture](#️-system-architecture)
- [🛠️ Tech Stack](#️-tech-stack)
- [📂 Directory Structure](#-directory-structure)
- [📡 API Reference Overview](#-api-reference-overview)
  - [🔑 Authentication (`/api/v1/auth`)](#-authentication-apiv1auth)
  - [👤 Users & Profiles (`/api/v1/users`)](#-users--profiles-apiv1users)
  - [💬 Chats & Groups (`/api/v1/chats`)](#-chats--groups-apiv1chats)
  - [✉️ Messages (`/api/v1/messages`)](#-messages-apiv1messages)
  - [🔔 Notifications (`/api/v1/notifications`)](#-notifications-apiv1notifications)
  - [📁 Files & Uploads (`/api/v1/files`)](#-files--uploads-apiv1files)
- [⚡ Socket.io Events Reference](#-socketio-events-reference)
- [🗄️ Database Models](#️-database-models)
- [🚀 Quick Start Guide](#-quick-start-guide)
- [⚙️ Environment Variables](#️-environment-variables)
- [🛡️ Security & Performance](#️-security--performance)
- [📜 License](#-license)

---

## 📌 Overview

This project is a modern, scalable, and feature-rich **Full-Stack Real-Time Chat Application**. Built with state-of-the-art web technologies, it offers sub-second messaging latency, low server overhead via Redis Pub/Sub multi-node distribution, asynchronous background job queuing using BullMQ, and a stunning, responsive React 19 UI with fluid micro-interactions.

Whether you're sending direct 1-on-1 messages, managing group conversations with admin permissions, sharing rich media attachments, tracking online presence, or configuring privacy settings, this application provides an enterprise-grade foundation.

---

## 🔥 Key Features

| Category | Feature | Description |
| :--- | :--- | :--- |
| ⚡ **Real-Time Engine** | **Sub-Second Messaging** | Real-time message dispatching & delivery powered by Socket.io, synchronized across multiple backend instances via Redis Pub/Sub. |
| 🟢 **Presence & Receipts** | **Live Presence & Typing** | Heartbeat-based online/offline status detection, dynamic live typing indicators, and message delivery/read status receipts (`delivered`, `read`). |
| 👥 **Conversations** | **Direct & Group Chats** | Instant 1-on-1 private messaging and feature-complete group chats with member management and admin controls. |
| 🔔 **Notifications** | **In-App Notification Center** | Real-time push notifications for incoming messages, group invitations, and system updates, with unread counters, batch read, and clear-all capabilities. |
| ☁️ **Media Attachments** | **Cloud Media Uploads** | Direct browser-to-cloud signed uploads via Cloudinary for images, videos, audio recordings, and document files with security scanning. |
| 🔐 **Authentication** | **Enterprise Auth & Security** | JWT Access & Refresh token rotation, HTTP-only secure cookie sessions, device tracking, password visibility toggles, dark-themed verification & password reset flows. |
| 🚫 **Privacy & Control** | **User Blocking & Settings** | Granular user blocking/unblocking, configurable last-seen visibility, online presence privacy controls, and custom profiles. |
| 🎨 **Modern Frontend UI** | **Sleek React 19 Interface** | Built with Vite, React 19, TypeScript, Tailwind CSS v4, dark glassmorphism design system (`#050505`/`#09090B`), Lucide icons, virtualized message rendering, and toast alerts with Sonner. |

---

## 🏗️ System Architecture

```text
┌──────────────────────────────────────────────────────────────────────────────────┐
│                               React 19 Frontend                                   │
│            (TypeScript + Vite + Tailwind CSS v4 + Zustand + Socket.io)            │
└───────────────────────────┬──────────────────────────▲───────────────────────────┘
                            │                          │
                    HTTP REST API                     WebSockets (Socket.io)
                            │                          │
┌───────────────────────────▼──────────────────────────┴───────────────────────────┐
│                               Express.js API Gateway                              │
│         (Auth Guards + Helmet Security + Zod Validation + Rate Limiters)         │
└──────┬────────────────────┬────────────────────┬────────────────────┬────────────┘
       │                    │                    │                    │
┌──────▼──────┐      ┌──────▼──────┐      ┌──────▼──────┐      ┌──────▼──────┐
│  MongoDB    │      │    Redis    │      │   BullMQ    │      │ Cloudinary  │
│  (Database) │      │  Pub / Sub  │      │ (Queues/Mail)│     │(Media Engine)│
└─────────────┘      └─────────────┘      └─────────────┘      └─────────────┘
```

---

## 🛠️ Tech Stack

### Frontend Stack
- **Framework:** React 19 (`react`, `react-dom`)
- **Language:** TypeScript 6
- **Build Tool:** Vite 8
- **Styling:** Tailwind CSS v4 (`@tailwindcss/vite`, `clsx`, `tailwind-merge`)
- **State Management & Data Fetching:** Zustand, TanStack React Query v5
- **List Virtualization:** TanStack React Virtual v3
- **Forms & Validation:** React Hook Form, Zod, `@hookform/resolvers`
- **Real-Time Client:** `socket.io-client` v4.8
- **Icons & UI Feedback:** Lucide React icons, Sonner toast notifications
- **Linter & Code Quality:** Oxlint

### Backend Stack
- **Runtime & Framework:** Node.js (v18+), Express.js (v5)
- **Database & ORM:** MongoDB, Mongoose ODM (v9)
- **Caching & Real-Time Sync:** Redis (v6+), IoRedis, `@socket.io/redis-adapter`
- **Real-Time WebSocket Engine:** Socket.io (v4)
- **Background Queues & Mail:** BullMQ, Nodemailer / Brevo integration
- **Media Engine:** Cloudinary Node SDK
- **Security & Utilities:** Zod schema validation, BcryptJS, JSONWebToken, Helmet security headers, Winston structured logging

---

## 📂 Directory Structure

```text
Real-Time Chat Application/
├── frontend/                        # React 19 Frontend Application
│   ├── src/
│   │   ├── api/                     # Axios HTTP client configuration & endpoint calls
│   │   ├── assets/                  # Static assets & brand imagery
│   │   ├── components/              # UI Components
│   │   │   ├── auth/                # Login, Register & Auth forms
│   │   │   ├── chat/                # Sidebar, MessageBubble, ChatWindow, Modals, Drawers
│   │   │   ├── common/              # Buttons, Loaders, Input fields, Modals
│   │   │   └── layout/              # Navigation headers & side panels
│   │   ├── hooks/                   # Custom React hooks (useAuth, useChat, useSocket, etc.)
│   │   ├── pages/                   # Application pages (Landing, Auth, Chat, Notifications, Settings)
│   │   ├── socket/                  # Socket.io client instance & event listeners
│   │   ├── store/                   # Zustand global state stores
│   │   ├── types/                   # TypeScript interfaces & type declarations
│   │   ├── App.tsx                  # Main routes setup & layout wrappers
│   │   └── main.tsx                 # React entry point
│   ├── package.json                 # Frontend dependencies & scripts
│   └── vite.config.ts               # Vite configuration & dev server options
│
└── backend/                         # Node.js + Express Backend Infrastructure
    ├── src/
    │   ├── common/                  # AppError class, HTTP response wrappers & error handlers
    │   ├── config/                  # DB connection, Cloudinary config, Logger & Env setup
    │   ├── middleware/              # Auth guard, Zod request validator, Rate limiters
    │   ├── model/                   # MongoDB Mongoose schemas (User, Message, Session, etc.)
    │   ├── modules/                 # Modular Domain Architecture
    │   │   ├── auth/                # Authentication & Session controllers/services
    │   │   ├── chats/               # Chat & Group management controllers/services
    │   │   ├── files/               # Cloudinary upload signing & verification controllers
    │   │   ├── messages/            # Messaging history & CRUD controllers
    │   │   ├── notifications/       # Notification list & unread badge controllers
    │   │   └── users/               # Profile management & user blocking controllers
    │   ├── queues/                  # BullMQ asynchronous background workers & queues
    │   ├── redis/                   # IoRedis connection client & Pub/Sub adapter
    │   ├── routes/                  # Central API router (/api/v1)
    │   ├── socket/                  # WebSocket connection, presence & messaging handlers
    │   ├── utils/                   # Token generators, signatures & email utilities
    │   ├── app.js                   # Express application setup & middleware stack
    │   └── server.js                # Server entry point & HTTP listener
    ├── .env                         # Backend environment configuration
    └── package.json                 # Backend dependencies & scripts
```

---

## 📡 API Reference Overview

All REST API endpoints are namespaced under `/api/v1`.

### 🔑 Authentication (`/api/v1/auth`)

| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :---: |
| `POST` | `/register` | Register a new user account | ❌ |
| `POST` | `/login` | Authenticate user & start device session | ❌ |
| `POST` | `/refresh` | Issue new access token via refresh cookie | ❌ |
| `POST` | `/logout` | Invalidate active session token & log out | ✅ |
| `GET` | `/verify-email/:token` | Verify user email address token | ❌ |
| `POST` | `/resend-verification` | Request a new email verification link | ❌ |
| `POST` | `/forgot-password` | Request password reset token via email queue | ❌ |
| `POST` | `/reset-password/:token` | Reset user password using token | ❌ |

### 👤 Users & Profiles (`/api/v1/users`)

| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :---: |
| `GET` | `/me` | Fetch authenticated user's profile | ✅ |
| `POST` | `/complete-profile` | Complete initial profile onboarding | ✅ |
| `PATCH` | `/profile` | Update profile info & privacy settings | ✅ |
| `GET` | `/search` | Search users by username or email | ✅ |
| `GET` | `/blocked` | List all users blocked by active user | ✅ |
| `POST` | `/:userId/block` | Block a specific user | ✅ |
| `DELETE` | `/:userId/block` | Unblock a specific user | ✅ |
| `GET` | `/:id` | Fetch public profile details of a user | ✅ |

### 💬 Chats & Groups (`/api/v1/chats`)

| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :---: |
| `POST` | `/` | Create a new 1-on-1 or group conversation | ✅ |
| `GET` | `/` | Fetch all active conversations for current user | ✅ |
| `POST` | `/:conversationId/participants` | Add a user to a group conversation | ✅ |
| `DELETE` | `/:conversationId/participants/:userId` | Remove a participant from a group | ✅ |
| `DELETE` | `/:conversationId` | Delete group chat (Admin only) | ✅ |

### ✉️ Messages (`/api/v1/messages`)

| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :---: |
| `POST` | `/` | Send a message to a conversation | ✅ |
| `GET` | `/:conversationId` | Fetch paginated chat history | ✅ |
| `POST` | `/:id/react` | Add an emoji reaction to a message | ✅ |
| `DELETE` | `/:id/react` | Remove an emoji reaction | ✅ |
| `PATCH` | `/:id` | Edit sent message content | ✅ |
| `DELETE` | `/:id` | Soft delete a message | ✅ |

### 🔔 Notifications (`/api/v1/notifications`)

| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :---: |
| `GET` | `/` | Fetch user's notification list | ✅ |
| `GET` | `/unread-count` | Get total count of unread notifications | ✅ |
| `PATCH` | `/read-all` | Mark all notifications as read | ✅ |
| `PATCH` | `/:id/read` | Mark a specific notification as read | ✅ |
| `DELETE` | `/clear-all` | Clear all notifications for authenticated user | ✅ |
| `DELETE` | `/:id` | Delete a specific notification | ✅ |

### 📁 Files & Uploads (`/api/v1/files`)

| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :---: |
| `GET` | `/sign` | Request Cloudinary pre-signed upload URL | ✅ |
| `POST` | `/verify` | Save uploaded file metadata to database | ✅ |
| `POST` | `/webhook/scan` | Cloudinary asynchronous scan notification webhook | ❌ |

---

## ⚡ Socket.io Events Reference

To establish a WebSocket connection, pass the Bearer JWT token in the handshake authorization object:

```typescript
import { io } from "socket.io-client";

const socket = io("http://localhost:5000", {
  auth: { token: "Bearer YOUR_ACCESS_TOKEN" }
});
```

### Event Specification

| Category | Event Name | Direction | Payload Description |
| :--- | :--- | :--- | :--- |
| **Presence** | `heartbeat` | Client ➔ Server | Keeps connection active & updates user online presence |
| **Presence** | `user_online` | Server ➔ Client | Emitted when a contact/user comes online |
| **Presence** | `user_offline` | Server ➔ Client | Emitted when a contact/user disconnects |
| **Messaging** | `send_message` | Client ➔ Server | Dispatches a message to a direct chat or group room |
| **Messaging** | `new_message` | Server ➔ Client | Broadcasts an incoming real-time message |
| **Typing** | `typing_start` | Client ➔ Server | Broadcasts typing state to conversation participants |
| **Typing** | `typing_stop` | Client ➔ Server | Clears typing indicator for participants |
| **Receipts** | `message_delivered`| Server ➔ Client | Confirms message successfully delivered to recipient |
| **Receipts** | `message_read` | Server ➔ Client | Notifies sender that recipient has read the message |

---

## 🗄️ Database Models

The application utilizes optimized MongoDB Mongoose schemas:

- **`User`**: Stores user authentication credentials, email verification status, display names, avatars, bio, and custom privacy settings (`onlineStatus`, `lastSeen`).
- **`Conversation`**: Manages chat metadata (Direct or Group), title, avatar, last message reference, and timestamp.
- **`Participant`**: Maps users to conversations with custom roles (`admin`, `member`), unread notification counts, and status.
- **`Message`**: Stores text content, attachments array, sender ID, conversation ID, status (`sent`, `delivered`, `read`), and emoji reactions.
- **`Session`**: Tracks active login sessions, refresh tokens, device IP, user-agent, and expiration details.
- **`Notification`**: Stores system alerts, message previews, unread badges, and user targets.
- **`File`**: Keeps metadata for Cloudinary media uploads (public ID, file URL, type, size, owner).
- **`BlockedUser`**: Manages user block relationships and restrictions.

---

## 🚀 Quick Start Guide

### Prerequisites
Before running the application locally, ensure you have the following installed:
- **Node.js**: `v18.x` or higher
- **MongoDB**: `v6.0+` (Local instance or [MongoDB Atlas](https://www.mongodb.com/cloud/atlas))
- **Redis**: `v6.0+` (Local instance or [Redis Cloud](https://redis.io/cloud/))

---

### Step 1: Clone the Repository
```bash
git clone https://github.com/buildwithrishabh/Real-Time-Chatting-Application-.git
cd "Real-Time Chat Application"
```

---

### Step 2: Backend Setup

1. Navigate to the `backend` folder and install dependencies:
   ```bash
   cd backend
   npm install
   ```

2. Create a `.env` file in the `backend` directory:
   ```env
   PORT=5000
   NODE_ENV=development
   CORS_ORIGIN=http://localhost:5173

   # Database Setup
   MONGODB_URI=mongodb://localhost:27017/ChatDB

   # Redis Configuration
   REDIS_HOST=localhost
   REDIS_PORT=6379
   REDIS_PASSWORD=

   # Security & Token Secrets (Min 32 characters recommended)
   JWT_ACCESS_SECRET=your_super_secret_jwt_access_key_here
   JWT_REFRESH_SECRET=your_super_secret_jwt_refresh_key_here
   COOKIE_SECRET=your_super_secret_cookie_encryption_key

   # Cloudinary Media Storage
   CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
   CLOUDINARY_API_KEY=your_cloudinary_api_key
   CLOUDINARY_API_SECRET=your_cloudinary_api_secret

   # Email Service (Brevo / SMTP)
   BREVO_API_KEY=your_brevo_api_key
   BREVO_SENDER_EMAIL=noreply@yourdomain.com
   ```

3. Start the Backend Development Server:
   ```bash
   npm run dev
   ```
   *The server will start listening on `http://localhost:5000`.*

---

### Step 3: Frontend Setup

1. Open a new terminal window, navigate to the `frontend` folder, and install dependencies:
   ```bash
   cd frontend
   npm install
   ```

2. Create a `.env` file in the `frontend` directory:
   ```env
   VITE_API_URL=http://localhost:5000/api/v1
   VITE_WS_URL=http://localhost:5000
   VITE_CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name

   # Optional TURN server for reliable WebRTC calls on restrictive NATs
   VITE_TURN_URL=turn:your-turn.example.com:3478
   VITE_TURN_USERNAME=your_turn_username
   VITE_TURN_PASSWORD=your_turn_password
   ```

3. Start the Frontend Vite Development Server:
   ```bash
   npm run dev
   ```
   *The Vite application will be available at `http://localhost:5173`.*

---

## ⚙️ Environment Variables Reference

### Backend (`/backend/.env`)

| Variable | Description | Example / Default |
| :--- | :--- | :--- |
| `PORT` | Server listening port | `5000` |
| `NODE_ENV` | Environment mode (`development` / `production`) | `development` |
| `CORS_ORIGIN` | Allowed client URL for CORS policy | `http://localhost:5173` |
| `MONGODB_URI` | Connection URI for MongoDB instance | `mongodb://localhost:27017/ChatDB` |
| `REDIS_HOST` | Host address of Redis server | `localhost` |
| `REDIS_PORT` | Port of Redis server | `6379` |
| `REDIS_PASSWORD` | Password for Redis authentication | *Optional* |
| `JWT_ACCESS_SECRET` | Secret key for signing Access Tokens | *Random 32+ char string* |
| `JWT_REFRESH_SECRET` | Secret key for signing Refresh Tokens | *Random 32+ char string* |
| `COOKIE_SECRET` | Encryption secret for signed cookies | *Random 32+ char string* |
| `CLOUDINARY_CLOUD_NAME` | Cloudinary account Cloud Name | *Cloudinary ID* |
| `CLOUDINARY_API_KEY` | Cloudinary API Key | *Cloudinary Key* |
| `CLOUDINARY_API_SECRET` | Cloudinary API Secret | *Cloudinary Secret* |
| `BREVO_API_KEY` | API Key for Brevo email dispatching | *Brevo key* |
| `BREVO_SENDER_EMAIL` | Sender email address for system emails | `noreply@domain.com` |

### Frontend (`/frontend/.env`)

| Variable | Description | Example / Default |
| :--- | :--- | :--- |
| `VITE_API_URL` | Base URL for REST API requests | `http://localhost:5000/api/v1` |
| `VITE_WS_URL` | Base WebSocket server URL | `http://localhost:5000` |
| `VITE_CLOUDINARY_CLOUD_NAME` | Cloudinary Cloud Name for client widget | *Cloudinary ID* |
| `VITE_TURN_URL` | TURN server URL for WebRTC calls (e.g. `turn:host:3478`) | *Optional* |
| `VITE_TURN_USERNAME` | TURN server username | *Optional* |
| `VITE_TURN_PASSWORD` | TURN server password | *Optional* |

---

## 🛡️ Security & Performance

- **Rate Limiting:** Protects sensitive endpoints (login, register, email resend) from brute force attacks using configurable sliding window limiters.
- **Security Headers:** Enforces security policies via `Helmet.js` (HSTS, CSP, X-Frame-Options, X-Content-Type-Options).
- **Zod Data Validation:** Every incoming API request body, query parameter, and payload is validated against strict TypeScript & Zod schemas.
- **JWT Rotation & Refreshing:** Access tokens are short-lived, while refresh tokens are stored in secure HTTP-only cookies and validated against MongoDB session documents.
- **Offloaded Heavy Work:** Asynchronous tasks like sending verification emails and push notifications are offloaded to **BullMQ** workers to keep the main event loop responsive.
- **Horizontal Scalability:** Thanks to Redis Pub/Sub adapter integration, Socket.io WebSocket connections can scale horizontally across multiple node processes or Docker containers.

---

## 📜 License

Distributed under the **ISC License**. See `LICENSE` for more details.

---

<div align="center">
  <sub>Built with ❤️ by <b>Rishabh Kumar</b></sub>
</div>
