# 🏗️ Kiến trúc & Luồng xử lý - Discord Chat Application

## 📋 Mục lục

1. [Tổng quan Kiến trúc](#1-tổng-quan-kiến-trúc)
2. [Backend Architecture](#2-backend-architecture)
3. [Frontend Architecture](#3-frontend-architecture)
4. [Database Schema](#4-database-schema)
5. [Luồng xử lý chính](#5-luồng-xử-lý-chính)
6. [WebSocket Communication](#6-websocket-communication)
7. [Authentication & Authorization](#7-authentication--authorization)
8. [State Management](#8-state-management)

---

## 1. Tổng quan Kiến trúc

### Tech Stack

**Backend:**
- **FastAPI** - Python web framework
- **PostgreSQL** - Relational database
- **SQLAlchemy** - ORM
- **WebSocket** - Real-time communication
- **JWT** - Token-based authentication
- **OAuth2** - Social login (Google, GitHub)

**Frontend:**
- **React 18** - UI library
- **Vite** - Build tool & dev server
- **Zustand** - State management (lightweight)
- **Axios** - HTTP client
- **React Router** - Client-side routing
- **WebSocket API** - Real-time messaging

### Deployment Architecture

```
┌─────────────┐
│   Browser   │
│  (React)    │
└──────┬──────┘
       │
       ├─── HTTP/REST ────────┐
       │                      │
       └─── WebSocket ────────┤
                              │
                    ┌─────────▼─────────┐
                    │   FastAPI Server  │
                    │   (Port 8000)     │
                    └─────────┬─────────┘
                              │
                    ┌─────────▼─────────┐
                    │   PostgreSQL DB   │
                    │   (Port 5432)     │
                    └───────────────────┘
```

---

## 2. Backend Architecture

### 2.1. Cấu trúc Thư mục

```
backend/
├── app/
│   ├── api/                    # API endpoints
│   │   ├── auth.py            # Authentication endpoints
│   │   ├── users.py           # User management
│   │   ├── rooms.py           # Room/Channel management
│   │   ├── messages.py        # Message CRUD
│   │   ├── admin.py           # Admin panel APIs
│   │   └── websocket.py       # WebSocket endpoint
│   │
│   ├── core/                   # Core configurations
│   │   ├── config.py          # Settings & environment variables
│   │   ├── security.py        # JWT, password hashing
│   │   └── database.py        # Database connection
│   │
│   ├── models/                 # SQLAlchemy models
│   │   ├── user.py            # User model
│   │   ├── message.py         # Message model
│   │   └── room.py            # Room & RoomMember models
│   │
│   ├── schemas/                # Pydantic schemas (validation)
│   │   ├── user.py
│   │   ├── message.py
│   │   └── room.py
│   │
│   ├── services/               # Business logic
│   │   └── websocket.py       # WebSocket manager
│   │
│   └── main.py                 # FastAPI application entry
│
├── requirements.txt
├── .env.example
└── create_superadmin.py        # CLI tool
```

### 2.2. Database Models

#### User Model
```python
class User:
    id: int (PK)
    username: str (unique)
    email: str (unique)
    hashed_password: str (nullable for OAuth)
    full_name: str
    avatar_url: str
    is_active: bool
    is_online: bool
    role: Enum (user, moderator, admin, super_admin)
    oauth_provider: str (google, github, None)
    oauth_id: str
    created_at: datetime
    last_seen: datetime
```

#### Room Model
```python
class Room:
    id: int (PK)
    name: str (unique)
    description: str
    is_private: bool
    created_at: datetime
    
class RoomMember:
    id: int (PK)
    room_id: int (FK -> Room)
    user_id: int (FK -> User)
    joined_at: datetime
    is_admin: bool
```

#### Message Model
```python
class Message:
    id: int (PK)
    content: str
    sender_id: int (FK -> User)
    room_id: int (FK -> Room, nullable)
    receiver_id: int (FK -> User, nullable)
    is_private: bool
    created_at: datetime
    is_edited: bool
    is_deleted: bool
    reply_to_message_id: int (FK -> Message, nullable)  # v2.2
    # Pin feature (NEW - v2.1)
    is_pinned: bool (default: False, indexed)
    pinned_at: datetime (nullable)
    pinned_by_user_id: int (FK -> User, nullable)
    # Legacy single file fields (backward compatible)
    file_url: str (nullable)
    file_name: str (nullable)
    file_type: str (nullable)

#### Attachment Model (v2.0)
class Attachment:
    id: int (PK)
    message_id: int (FK -> Message)
    file_url: str
    file_name: str
    file_type: str
    file_size: bigint (nullable)
    created_at: datetime

#### Message Reaction Model (v2.3)
class MessageReaction:
    id: int (PK)
    message_id: int (FK -> Message)
    user_id: int (FK -> User)
    emoji: str
    created_at: datetime
    # Unique constraint: (message_id, user_id, emoji)
```

### 2.3. API Endpoints

#### Authentication (`/api/auth`)
- `POST /register` - Register new user
- `POST /login` - Login with username/password
- `GET /me` - Get current user info
- `GET /google` - Google OAuth URL
- `GET /google/callback` - Google OAuth callback
- `GET /github` - GitHub OAuth URL
- `GET /github/callback` - GitHub OAuth callback

#### Users (`/api/users`)
- `GET /` - Get all users
- `GET /online` - Get online users
- `GET /{user_id}` - Get user by ID
- `PUT /me` - Update profile

#### Rooms (`/api/rooms`)
- `GET /` - Get all public rooms
- `POST /` - Create room (Admin only)
- `GET /{room_id}` - Get room details
- `POST /{room_id}/join` - Join room
- `POST /{room_id}/leave` - Leave room
- `GET /{room_id}/members` - Get room members
- `DELETE /{room_id}` - Delete room (Admin only)

#### Messages (`/api/messages`)
- `POST /` - Send message
- `GET /room/{room_id}` - Get room messages
- `GET /private/{user_id}` - Get private messages
- `PUT /{message_id}` - Edit message
- `DELETE /{message_id}` - Delete message
- `POST /{message_id}/pin` - Pin message (v2.1) 🆕
- `DELETE /{message_id}/pin` - Unpin message (v2.1) 🆕
- `GET /pinned/room/{room_id}` - Get pinned messages in room (v2.1) 🆕
- `GET /pinned/private/{user_id}` - Get pinned messages in private chat (v2.1) 🆕
- `POST /{message_id}/reactions` - Add reaction (v2.3)
- `DELETE /{message_id}/reactions/{emoji}` - Remove reaction (v2.3)

#### Admin (`/api/admin`)
- `GET /stats` - Platform statistics
- `GET /users` - Get all users (Admin)
- `PUT /users/{user_id}/role` - Change user role (Super Admin)
- `PUT /users/{user_id}/activate` - Activate user
- `PUT /users/{user_id}/deactivate` - Deactivate user
- `DELETE /users/{user_id}` - Delete user (Super Admin)

#### WebSocket (`/api/ws`)
- `WS /ws?token={jwt}` - WebSocket connection

---

## 3. Frontend Architecture

### 3.1. Cấu trúc Thư mục

```
frontend/
├── src/
│   ├── components/           # React components
│   │   ├── Sidebar.jsx      # Left sidebar (channels)
│   │   ├── ChatArea.jsx     # Main chat area
│   │   └── UserList.jsx     # Right sidebar (members)
│   │
│   ├── pages/               # Page components
│   │   ├── Login.jsx
│   │   ├── Register.jsx
│   │   ├── Chat.jsx         # Main chat page
│   │   └── AdminPanel.jsx   # Admin dashboard
│   │
│   ├── services/            # API & WebSocket
│   │   ├── api.js           # Axios instance & API calls
│   │   └── websocket.js     # WebSocket service class
│   │
│   ├── styles/              # CSS files
│   │   ├── index.css        # Global styles
│   │   ├── auth.css
│   │   ├── chat.css
│   │   ├── sidebar.css
│   │   ├── chatarea.css
│   │   ├── userlist.css
│   │   └── admin.css
│   │
│   ├── utils/               # Utilities
│   │   └── store.js         # Zustand stores
│   │
│   ├── App.jsx              # Root component
│   └── main.jsx             # Entry point
│
├── public/
├── index.html
├── package.json
└── vite.config.js
```

### 3.2. Component Hierarchy

```
App
├── Login
├── Register
├── Chat
│   ├── Sidebar
│   │   ├── Channel List
│   │   ├── Create Channel Modal
│   │   └── User Panel
│   │
│   ├── ChatArea
│   │   ├── Chat Header
│   │   ├── Messages List
│   │   └── Message Input
│   │
│   └── UserList
│       ├── Online Users Section
│       └── Offline Users Section
│
└── AdminPanel
    ├── Statistics Cards
    ├── User Management Table
    └── Role Distribution
```

---

## 4. Database Schema

### Entity Relationship Diagram (Updated v2.0)

```
┌─────────────────┐
│     User        │
├─────────────────┤
│ id (PK)         │◄─────┐
│ username        │      │
│ email           │      │
│ hashed_password │      │
│ role            │      │
│ is_online       │      │
└─────────────────┘      │
        │                │
        │                │
        ├────────────────┼─────────────┐
        │                │             │
        │                │             │
┌───────▼─────────┐  ┌───┴──────────┐ │
│   RoomMember    │  │   Message    │ │
├─────────────────┤  ├──────────────┤ │
│ id (PK)         │  │ id (PK)      │ │
│ room_id (FK)    │  │ content      │ │
│ user_id (FK)    │  │ sender_id(FK)├─┘
│ is_admin        │  │ room_id (FK) │
│ joined_at       │  │ receiver_id  │
└────────┬────────┘  │ is_private   │
         │           │ created_at   │
         │           └──────┬───────┘
         │                  │
    ┌────▼──────────┐       │         ┌──────────────────┐
    │     Room      │◄──────┘         │  Attachment (NEW)│
    ├───────────────┤                 ├──────────────────┤
    │ id (PK)       │                 │ id (PK)          │
    │ name          │                 │ message_id (FK)  │───┐
    │ description   │                 │ file_url         │   │
    │ is_private    │                 │ file_name        │   │
    │ created_at    │                 │ file_type        │   │
    └───────────────┘                 │ file_size        │   │
                                      │ created_at       │   │
                                      └──────────────────┘   │
                                              │              │
                                              └──────────────┘
                                         (Multiple attachments
                                          per message)
```

### Constraints & Indexes

**Primary Keys:**
- `users.id`
- `rooms.id`
- `messages.id`
- `attachments.id` (NEW)
- `room_members.id`

**Unique Constraints:**
- `users.username`
- `users.email`
- `rooms.name`

**Indexes:**
- `users.username` (unique index)
- `users.email` (unique index)
- `messages.created_at` (for sorting)
- `messages.room_id` (for filtering)
- `messages.is_pinned` (v2.1 - for fast pinned message queries) 🆕
- `attachments.message_id` (v2.0 - for fast attachment queries)
- `message_reactions.message_id` (v2.3 - for reaction queries)

**Foreign Keys:**
- `room_members.room_id` → `rooms.id` (CASCADE DELETE)
- `room_members.user_id` → `users.id` (CASCADE DELETE)
- `messages.sender_id` → `users.id`
- `messages.room_id` → `rooms.id`
- `messages.receiver_id` → `users.id`
- `messages.reply_to_message_id` → `messages.id` (v2.2)
- `messages.pinned_by_user_id` → `users.id` (v2.1) 🆕
- `attachments.message_id` → `messages.id` (CASCADE DELETE) (v2.0)
- `message_reactions.message_id` → `messages.id` (CASCADE DELETE) (v2.3)
- `message_reactions.user_id` → `users.id` (CASCADE DELETE) (v2.3)

---

## 5. Luồng xử lý chính

### 5.1. User Registration Flow

```
Client                  Backend                 Database
  │                        │                        │
  ├─ POST /api/auth/register                       │
  │   {username, email, password}                   │
  │                        │                        │
  │                        ├─ Validate input        │
  │                        ├─ Check existing user ──►
  │                        │                        │
  │                        ◄─ No duplicate          │
  │                        │                        │
  │                        ├─ Hash password         │
  │                        │   (bcrypt)             │
  │                        │                        │
  │                        ├─ Create user record ───►
  │                        │                        │
  │                        ◄─ User created          │
  │                        │                        │
  │                        ├─ Generate JWT token    │
  │                        │   {sub: user_id}       │
  │                        │                        │
  │ ◄─ {access_token, user}│                        │
  │                        │                        │
  ├─ Store token (localStorage)                     │
  │                        │                        │
  └─ Redirect to /chat    │                        │
```

### 5.2. Login Flow

```
Client                  Backend                 Database
  │                        │                        │
  ├─ POST /api/auth/login │                        │
  │   {username, password} │                        │
  │                        │                        │
  │                        ├─ Find user by username ►
  │                        │                        │
  │                        ◄─ User record           │
  │                        │                        │
  │                        ├─ Verify password       │
  │                        │   bcrypt.verify()      │
  │                        │                        │
  │                        ├─ ✓ Password valid      │
  │                        │                        │
  │                        ├─ Generate JWT          │
  │                        │                        │
  │ ◄─ {access_token, user}│                        │
  │                        │                        │
  ├─ Store token          │                        │
  │                        │                        │
  └─ Redirect to /chat    │                        │
```

### 5.3. OAuth Login Flow (Google/GitHub)

```
Client                  Backend                 OAuth Provider        Database
  │                        │                          │                  │
  ├─ GET /api/auth/google │                          │                  │
  │                        │                          │                  │
  │ ◄─ {url: google_auth_url}                        │                  │
  │                        │                          │                  │
  ├─ Redirect to Google ──────────────────────────►  │                  │
  │                        │                          │                  │
  │ ◄─────────────────────────── Authorization page  │                  │
  │                        │                          │                  │
  ├─ User approves ───────────────────────────────►  │                  │
  │                        │                          │                  │
  │ ◄─────────────────────────── Redirect with code  │                  │
  │                        │                          │                  │
  ├─ GET /api/auth/google/callback?code=XXX          │                  │
  │                        │                          │                  │
  │                        ├─ Exchange code for token─►                  │
  │                        │                          │                  │
  │                        ◄─ Access token           │                  │
  │                        │                          │                  │
  │                        ├─ Get user info ─────────►                  │
  │                        │                          │                  │
  │                        ◄─ User data (email, name, avatar)            │
  │                        │                          │                  │
  │                        ├─ Find/Create user ───────────────────────► │
  │                        │                          │                  │
  │                        ◄─ User record ────────────────────────────── │
  │                        │                          │                  │
  │                        ├─ Generate JWT           │                  │
  │                        │                          │                  │
  │ ◄─ {access_token, user}│                          │                  │
  │                        │                          │                  │
  └─ Redirect to /chat    │                          │                  │
```

### 5.4. WebSocket Connection Flow

```
Client                  Backend                 ConnectionManager
  │                        │                          │
  ├─ WS /api/ws?token=JWT │                          │
  │                        │                          │
  │                        ├─ Decode JWT             │
  │                        │                          │
  │                        ├─ Validate token         │
  │                        │                          │
  │                        ├─ Get user from DB       │
  │                        │                          │
  │                        ├─ Accept connection      │
  │                        │                          │
  │ ◄──────────────────── WebSocket OPEN             │
  │                        │                          │
  │                        ├─ Add to active_connections ──►
  │                        │                          │
  │                        ├─ Set user.is_online=True│
  │                        │                          │
  │                        ├─ Broadcast user_status ─────►
  │                        │   {type: "user_status",  │
  │                        │    user_id, is_online:true}
  │                        │                          │
  │ ◄──────────────────── {type: "online_users", user_ids}
  │                        │                          │
  │                        │                          │
  [Connected - bidirectional communication active]
  │                        │                          │
  │                        │                          │
  ├─ Disconnect           │                          │
  │                        │                          │
  │                        ├─ Remove from connections ──►
  │                        │                          │
  │                        ├─ Set user.is_online=False
  │                        │                          │
  │                        └─ Broadcast user_status ─────►
  │                            {is_online: false}     │
```

### 5.5. Send Message Flow (Real-time)

```
User A (Sender)        Backend/WebSocket         User B (Receiver)
     │                        │                         │
     ├─ Type message         │                         │
     │  "Hello!"              │                         │
     │                        │                         │
     ├─ WS send ─────────────►                         │
     │  {type: "chat_message" │                         │
     │   content: "Hello!",   │                         │
     │   room_id: 1}          │                         │
     │                        │                         │
     │                        ├─ Save to DB            │
     │                        │   INSERT INTO messages  │
     │                        │                         │
     │                        ├─ Broadcast to room ────┬──►
     │                        │   {type: "chat_message",│
     │                        │    id: 123,             │
     │ ◄──────────────────────┤    content: "Hello!",  │
     │                        │    sender_username,     │
     │                        │    created_at}          │
     │                        │                         │
     ├─ Display message      │                ◄────────┤
     │  (own message)         │                         │
     │                        │                         ├─ Display message
     │                        │                         │  (received)
     │                        │                         │
     │                        │                         ├─ Check if in room
     │                        │                         │  → Yes: No badge
     │                        │                         │  → No: Show badge
```

### 5.6. Create Room Flow (Admin Only)

```
Admin Client           Backend                 Database          All Clients
     │                     │                       │                  │
     ├─ Click "+"         │                       │                  │
     │                     │                       │                  │
     ├─ Fill form:         │                       │                  │
     │  {name: "general",  │                       │                  │
     │   description: "General chat"}              │                  │
     │                     │                       │                  │
     ├─ POST /api/rooms/ ─►                       │                  │
     │                     │                       │                  │
     │                     ├─ Check user.is_admin()│                  │
     │                     │   ✓ OK                │                  │
     │                     │                       │                  │
     │                     ├─ Check room name ─────►                  │
     │                     │   unique              │                  │
     │                     │                       │                  │
     │                     ◄─ No duplicate         │                  │
     │                     │                       │                  │
     │                     ├─ Create room ─────────►                  │
     │                     │                       │                  │
     │                     ◄─ Room created         │                  │
     │                     │                       │                  │
     │                     ├─ Add creator ─────────►                  │
     │                     │   as admin member     │                  │
     │                     │                       │                  │
     │ ◄─ Room response   │                       │                  │
     │                     │                       │                  │
     ├─ Refresh rooms list ──────────────────────►│                  │
     │                     │                       │                  │
     │ ◄─ Updated room list                       │                  │
     │                     │                       │                  │
     └─ Auto select room  │                       │                  │
```

### 5.7. Delete Room Flow (Admin + WebSocket Broadcast)

```
Admin                  Backend                 Database        All Online Users
  │                       │                        │                  │
  ├─ Click X on room     │                        │                  │
  │                       │                        │                  │
  ├─

### 🆕 Pin Message Feature (v2.1)

#### WebSocket Events

**Client → Server:**
```javascript
{
  type: 'pin_message',
  message_id: 123
}

{
  type: 'unpin_message',
  message_id: 123
}
```

**Server → Client:**
```javascript
// Message pinned
{
  type: 'message_pinned',
  message_id: 123,
  message: {
    id: 123,
    content: 'Important message',
    is_pinned: true,
    pinned_at: '2026-03-22T10:30:00',
    pinned_by_user_id: 1,
    pinned_by_username: 'john_doe'
  }
}

// Message unpinned
{
  type: 'message_unpinned',
  message_id: 123
}

// Error (e.g., pin limit reached)
{
  type: 'error',
  message: 'Maximum 5 messages can be pinned'
}
```

#### Pin Message Flow

```
User A                 Backend/WebSocket        Database          Other Users
  │                         │                       │                  │
  ├─ Click pin icon (📌)   │                       │                  │
  │                         │                       │                  │
  ├─ WS: pin_message ──────►                       │                  │
  │   {message_id: 123}     │                       │                  │
  │                         │                       │                  │
  │                         ├─ Validate message ────►                  │
  │                         │                       │                  │
  │                         ◄─ Message exists       │                  │
  │                         │                       │                  │
  │                         ├─ Check pin count ─────►                  │
  │                         │   (max 5 per room)    │                  │
  │                         │                       │                  │
  │                         ◄─ Count: 3 (OK)        │                  │
  │                         │                       │                  │
  │                         ├─ UPDATE messages ─────►                  │
  │                         │   SET is_pinned=TRUE  │                  │
  │                         │       pinned_at=NOW() │                  │
  │                         │       pinned_by=1     │                  │
  │                         │                       │                  │
  │                         ◄─ Updated              │                  │
  │                         │                       │                  │
  │                         ├─ Broadcast to room ──────────────────────►
  │ ◄─ message_pinned ──────┤   {type: 'message_pinned'}               │
  │                         │                       │                  │
  ├─ Show in banner        │                       │   ◄─ Show in banner
  │                         │                       │                  │
```

#### Database Changes (v2.1)

```sql
-- Migration: add_pin_migration.py
ALTER TABLE messages 
ADD COLUMN is_pinned BOOLEAN DEFAULT FALSE,
ADD COLUMN pinned_at TIMESTAMP,
ADD COLUMN pinned_by_user_id INTEGER REFERENCES users(id);

CREATE INDEX idx_messages_is_pinned ON messages(is_pinned);
```

**Migration for existing installations:**
```bash
cd backend
source venv/bin/activate
python add_pin_migration.py
```

---

