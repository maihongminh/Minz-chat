# Discord-like Real-time Chat Application

A modern real-time chat application built with **FastAPI** (Python) and **React**, featuring a Discord-inspired dark mode UI.

## Features

✅ **User Authentication**
- JWT-based authentication
- OAuth2 integration (Google & GitHub)
- User registration and login

✅ **Real-time Communication**
- WebSocket-based real-time messaging
- Private direct messages
- Public chat rooms
- Online/offline user status
- Typing indicators support

✅ **Chat Features**
- Create and join chat rooms
- Direct messaging between users
- Message history with pagination
- User avatars
- Timestamps
- **Multiple file upload** (up to 5 files per message) 🆕
- **Copy/Paste images from clipboard** (Ctrl+V / Cmd+V) 🆕
- Image preview and inline display
- Document upload and download
- Read receipts and typing indicators
- **Edit messages** - Edit your sent messages with inline editing 🆕
- **Delete messages** - Delete for yourself or everyone 🆕
- **Reply to messages** - Quote and reply to any message 🆕
  - Click reply icon to quote a message
  - Click on quote to jump to original message with smooth animation
  - Works with text, images, and file attachments
- **Message reactions** - React to messages with emoji 🆕
  - 6 emoji reactions: 👍 ❤️ 😂 😮 😢 🙏
  - Click to add/remove reactions
  - Realtime updates, works in rooms and private messages
  - Smart spacing and positioning
- **Message actions menu** - 3-dot menu on hover with Reaction/Edit/Delete/Reply options 🆕

✅ **Modern UI**
- Discord-inspired dark theme
- Responsive design
- Real-time updates
- Clean and intuitive interface

✅ **Mobile-First Experience** 🆕
- **📱 Mobile Home Screen** - Dedicated home view with channel and DM lists
- **🔙 Back Navigation** - Easy navigation between Home and Chat views
- **👤 Mobile User Menu** - Complete profile management on mobile
- **✏️ Profile Editor** - Edit username and upload avatar with validation
- **🔒 Password Manager** - Change password with security validation
- **📏 Smart Attachments** - Optimized image sizes for mobile (200px on mobile, 250px desktop)
- **🎯 Optimized UI** - Hamburger menu positioned at top-right for easy thumb access
- **📱 Responsive Breakpoints** - Optimized for 768px (tablet) and 480px (mobile)

## Tech Stack

### Backend
- **FastAPI** - Modern Python web framework
- **PostgreSQL** - Database
- **SQLAlchemy** - ORM
- **WebSockets** - Real-time communication
- **JWT** - Authentication
- **OAuth2** - Social login

### Frontend
- **React** - UI library
- **Vite** - Build tool
- **Zustand** - State management
- **Axios** - HTTP client
- **React Router** - Navigation
- **React Icons** - Icons

## Prerequisites

- Python 3.8+
- Node.js 16+
- PostgreSQL 12+
- npm or yarn

## Installation

### 1. Database Setup

Create a PostgreSQL database:

```bash
# Login to PostgreSQL
psql -U postgres

# Create database and user
CREATE DATABASE chatdb;
CREATE USER chatuser WITH PASSWORD 'chatpass';
GRANT ALL PRIVILEGES ON DATABASE chatdb TO chatuser;
```

**⚠️ For Existing Installations (Upgrading):**

If you're upgrading from a previous version, you need to run migration scripts:

```bash
cd backend

# Migration 1: Add reply_to_message_id column (v2.2)
python3 add_reply_column.py

# Migration 2: Add message_reactions table (v2.3)
python3 add_reactions_table.py
```

These migrations add support for reply-to-messages and reactions features.

### 2. Backend Setup

```bash
cd projects/Minz-chat/backend

# Create virtual environment
python -m venv venv

# Activate virtual environment
# On Linux/Mac:
source venv/bin/activate
# On Windows:
# venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Create .env file from example
cp .env.example .env

# Edit .env file with your configurations
nano .env
```

**Important:** Update the `.env` file with:
- Your database credentials
- A secure `SECRET_KEY` (generate one with: `openssl rand -hex 32`)
- OAuth2 credentials (optional, for Google/GitHub login)

**Initialize Database:**
```bash
# Create all database tables
python3 init_db.py
```

This will create all required tables: users, rooms, room_members, messages, message_reads, and attachments.

### 3. Frontend Setup

```bash
cd projects/Minz-chat/frontend

# Install dependencies
npm install
```

## Running the Application

### Start Backend (Terminal 1)

```bash
cd projects/Minz-chat/backend
source venv/bin/activate  # or venv\Scripts\activate on Windows

# Run with uvicorn
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

Backend will be available at: `http://localhost:8000`
API Documentation: `http://localhost:8000/docs`

### Start Frontend (Terminal 2)

```bash
cd projects/Minz-chat/frontend

# Run development server
npm run dev
```

Frontend will be available at: `http://localhost:3000`

## Usage

1. **Register an Account**
   - Go to `http://localhost:3000`
   - Click "Register" 
   - Fill in username, email, and password
   - Or use OAuth (Google/GitHub) if configured

2. **Create or Join Rooms**
   - Click the "+" button next to "TEXT CHANNELS"
   - Enter room name and description
   - Or join existing rooms

3. **Start Chatting**
   - Select a room to chat in public channels
   - Click on a user in the member list for private messages
   - Messages are delivered in real-time via WebSocket

4. **Send Files & Images**
   - **Upload files**: Click the paperclip icon 📎 to select up to 5 files
   - **Paste images**: Copy any image (screenshot, web image, etc.) and press **Ctrl+V** / **Cmd+V** in the message input
   - **Preview**: See thumbnails before sending
   - **Remove**: Click ✕ on any file to remove it from the preview
   - **Send**: Press Enter or click the send button

5. **View Online Users**
   - See who's online in the member list on the right
   - Green dot indicates online status

## Project Structure

```
projects/Minz-chat/
├── backend/
│   ├── app/
│   │   ├── api/          # API endpoints
│   │   │   ├── auth.py
│   │   │   ├── users.py
│   │   │   ├── rooms.py
│   │   │   ├── messages.py
│   │   │   └── websocket.py
│   │   ├── core/         # Core configurations
│   │   │   ├── config.py
│   │   │   ├── security.py
│   │   │   └── database.py
│   │   ├── models/       # Database models
│   │   │   ├── user.py
│   │   │   ├── message.py
│   │   │   └── room.py
│   │   ├── schemas/      # Pydantic schemas
│   │   │   ├── user.py
│   │   │   ├── message.py
│   │   │   └── room.py
│   │   ├── services/     # Business logic
│   │   │   └── websocket.py
│   │   └── main.py       # FastAPI app
│   ├── requirements.txt
│   └── .env
│
└── frontend/
    ├── src/
    │   ├── components/   # React components
    │   │   ├── Sidebar.jsx
    │   │   ├── ChatArea.jsx
    │   │   └── UserList.jsx
    │   ├── pages/        # Page components
    │   │   ├── Login.jsx
    │   │   ├── Register.jsx
    │   │   └── Chat.jsx
    │   ├── services/     # API & WebSocket services
    │   │   ├── api.js
    │   │   └── websocket.js
    │   ├── styles/       # CSS files
    │   │   ├── index.css
    │   │   ├── auth.css
    │   │   ├── chat.css
    │   │   ├── sidebar.css
    │   │   ├── chatarea.css
    │   │   └── userlist.css
    │   ├── utils/        # Utilities
    │   │   └── store.js  # Zustand store
    │   ├── App.jsx
    │   └── main.jsx
    ├── package.json
    └── vite.config.js
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user
- `GET /api/auth/google` - Google OAuth
- `GET /api/auth/github` - GitHub OAuth

### Users
- `GET /api/users/` - Get all users
- `GET /api/users/online` - Get online users
- `GET /api/users/{id}` - Get user by ID
- `PUT /api/users/me` - Update profile

### Rooms
- `GET /api/rooms/` - Get all rooms
- `POST /api/rooms/` - Create room
- `GET /api/rooms/{id}` - Get room by ID
- `POST /api/rooms/{id}/join` - Join room
- `POST /api/rooms/{id}/leave` - Leave room
- `GET /api/rooms/{id}/members` - Get room members

### Messages
- `POST /api/messages/` - Send message
- `GET /api/messages/room/{id}` - Get room messages
- `GET /api/messages/private/{id}` - Get private messages

### WebSocket
- `WS /api/ws?token={jwt_token}` - WebSocket connection

## WebSocket Message Types

**Client -> Server:**
```javascript
// Send message
{ type: "chat_message", content: "Hello!", room_id: 1, receiver_id: null }

// Join room
{ type: "join_room", room_id: 1 }

// Leave room
{ type: "leave_room", room_id: 1 }

// Typing indicator
{ type: "typing", is_typing: true, room_id: 1 }
```

**Server -> Client:**
```javascript
// New message
{ type: "chat_message", id: 1, content: "Hello!", sender_username: "user1", ... }

// User status
{ type: "user_status", user_id: 1, username: "user1", is_online: true }

// Online users list
{ type: "online_users", user_ids: [1, 2, 3] }
```

## Configuration

### OAuth2 Setup (Optional)

#### Google OAuth:
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project
3. Enable Google+ API
4. Create OAuth 2.0 credentials
5. Add authorized redirect URI: `http://localhost:8000/api/auth/google/callback`
6. Copy Client ID and Client Secret to `.env`

#### GitHub OAuth:
1. Go to GitHub Settings > Developer settings > OAuth Apps
2. Create a new OAuth App
3. Set Authorization callback URL: `http://localhost:8000/api/auth/github/callback`
4. Copy Client ID and Client Secret to `.env`

## Development

### Backend Development
```bash
# Run with auto-reload
uvicorn app.main:app --reload

# Access interactive API docs
http://localhost:8000/docs
```

### Frontend Development
```bash
# Development server with hot reload
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## Troubleshooting

**Database connection error:**
- Ensure PostgreSQL is running
- Check database credentials in `.env`
- Verify database exists

**WebSocket connection failed:**
- Ensure backend is running
- Check CORS settings
- Verify JWT token is valid

**OAuth not working:**
- Verify OAuth credentials in `.env`
- Check redirect URIs match exactly
- Enable required APIs in provider console

## Recent Updates

### v2.1 - Copy/Paste Image Feature 🎉
- ✅ **Paste images directly from clipboard** (Ctrl+V / Cmd+V)
- ✅ Auto-generate file names for pasted images
- ✅ Works with screenshots, copied images from web, etc.
- ✅ Seamlessly integrates with file upload system
- ✅ Combine pasted images with uploaded files (max 5 total)

### v2.0 - Multiple File Upload Feature
- ✅ Upload up to 5 files simultaneously
- ✅ Grid preview before sending
- ✅ Individual file removal
- ✅ Grid layout display in messages
- ✅ Support for images and documents (PDF, DOC, DOCX, TXT)
- ✅ Database optimized with separate attachments table
- ✅ Backward compatible with single file uploads

## Future Enhancements

- [x] ~~File upload and image sharing~~ ✅ **DONE (v2.0)**
- [x] ~~Copy/Paste images from clipboard~~ ✅ **DONE (v2.1)**
- [ ] Emoji picker and reactions
- [ ] Voice and video calls
- [ ] User roles and permissions (Partially done - Admin roles exist)
- [ ] Message editing and deletion
- [ ] Search functionality
- [ ] Notifications
- [ ] Mobile responsive improvements
- [ ] Dark/Light theme toggle
- [ ] Message formatting (markdown)
- [ ] Cloud storage integration (S3/Cloudinary)
- [ ] Image compression
- [ ] Drag & drop file upload
- [ ] Copy/Paste files (not just images)

## License

MIT License - feel free to use this project for learning or personal use.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## Admin & Super Admin Features

### User Roles
- **User**: Regular user with chat permissions
- **Moderator**: User with moderation capabilities
- **Admin**: Can access admin panel, view stats, manage users
- **Super Admin**: Full control including role management

### Create Super Admin
```bash
cd backend
source venv/bin/activate
python create_superadmin.py
```

### Admin Panel
Access at: `http://localhost:3000/admin`

Features:
- 📊 Dashboard with statistics
- 👥 User management
- 🔧 Role management (Super Admin only)
- ✅ Activate/Deactivate users
- 🗑️ Delete users (Super Admin only)

For detailed admin guide, see [ADMIN_GUIDE.md](ADMIN_GUIDE.md)
