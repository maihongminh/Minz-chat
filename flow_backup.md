📊 TỔNG QUAN LOGIC DỰ ÁN FIRST-CHAT

Tôi đã phân tích toàn bộ dự án Discord-like Real-time Chat Application. Đây là một ứng dụng chat thời gian thực với
kiến trúc FastAPI Backend + React Frontend. Dưới đây là phân tích chi tiết:

──────────────────────────────────────────────────────────────────────────────────────────────────────────────────────

                                                🏗️ KIẾN TRÚC TỔNG QUAN

                                                  Technology Stack:

 • Backend: FastAPI, SQLAlchemy, PostgreSQL, WebSocket, JWT Authentication
 • Frontend: React, Zustand (state management), Axios, WebSocket Client
 • Real-time: WebSocket cho chat real-time
 • Authentication: JWT + OAuth2 (Google, GitHub)

──────────────────────────────────────────────────────────────────────────────────────────────────────────────────────

                                    🔐 1. HỆ THỐNG AUTHENTICATION & AUTHORIZATION

                                    Backend Auth Logic (backend/app/api/auth.py):

 1 Register Flow:
    • Kiểm tra username/email trùng lặp
    • Hash password với bcrypt
    • Tạo user mới với role mặc định là USER
    • Tạo JWT token (expire 30 phút)
    • Return token + user info
 2 Login Flow:
    • Xác thực username/password
    • Verify password hash
    • Tạo JWT token với sub: user_id
    • Return token + user info
 3 OAuth Flow (Google/GitHub):
    • Redirect đến OAuth provider
    • Nhận callback với code
    • Exchange code → access_token
    • Fetch user info từ provider
    • Tìm hoặc tạo user mới (oauth_provider, oauth_id)
    • Generate unique username nếu trùng
    • Return JWT token
 4 Authorization Levels:
    • USER: Người dùng thông thường
    • MODERATOR: Có quyền kiểm duyệt
    • ADMIN: Quản trị viên (tạo/xóa channel)
    • SUPER_ADMIN: Quyền cao nhất (quản lý roles, xóa users)

                                     Frontend Auth (frontend/src/utils/store.js):

 • Sử dụng Zustand với persist middleware
 • Lưu token + user vào localStorage (key: auth-storage)
 • Axios interceptor tự động thêm Authorization: Bearer {token} vào mọi request

──────────────────────────────────────────────────────────────────────────────────────────────────────────────────────

                                            💬 2. HỆ THỐNG CHAT REAL-TIME

                          WebSocket Connection Manager (backend/app/services/websocket.py):

Cấu trúc dữ liệu:

```python
active_connections: Dict[user_id, List[WebSocket]]  # Support multiple devices
room_users: Dict[room_id, Set[user_id]]  # Track users in rooms
```

Luồng kết nối:

 1 Client gửi WebSocket request với token param
 2 Server authenticate token → lấy user
 3 Accept connection, thêm vào active_connections
 4 Set user.is_online = True
 5 Broadcast user status đến tất cả clients
 6 Gửi danh sách online users cho user mới

Message Types:

 • chat_message: Gửi tin nhắn (room hoặc private)
 • join_room: Join vào room
 • leave_room: Rời khỏi room
 • typing: Typing indicator
 • user_status: Online/offline broadcast
 • room_deleted: Thông báo room bị xóa

                                               Message Handling Logic:

Room Message:

```python
# Save to DB
new_message = Message(content, sender_id, room_id=room_id)
db.add(new_message)

# Broadcast to all users in room
message_data = {type, id, content, sender_username, sender_avatar, ...}
await manager.send_room_message(message_data, room_id)
```

Private Message:

```python
# Save to DB
new_message = Message(content, sender_id, receiver_id=receiver_id, is_private=True)

# Send to both sender and receiver
await manager.send_personal_message(message_data, sender_id)
await manager.send_personal_message(message_data, receiver_id)
```

                               Frontend WebSocket (frontend/src/services/websocket.js):

Features:

 • Auto-reconnect (max 5 attempts, 3s interval)
 • Message queue với handler callbacks
 • Methods: sendMessage(), joinRoom(), leaveRoom(), sendTyping()

Message Handler (frontend/src/pages/Chat.jsx):

```javascript
handleWebSocketMessage(data):
  - chat_message → addMessage, track unread nếu không phải current view
  - online_users → setOnlineUsers
  - user_status → updateUserStatus
  - room_deleted → refresh rooms, clear current room nếu match
```

──────────────────────────────────────────────────────────────────────────────────────────────────────────────────────

                                                 🗄️ 3. DATABASE MODELS

                                                     User Model:

```python
- id, username, email, hashed_password
- role: UserRole (user, moderator, admin, super_admin)
- is_active, is_online, last_seen
- oauth_provider, oauth_id (for OAuth users)
- avatar_url, full_name
```

                                                     Room Model:

```python
- id, name, description
- is_private (public/private rooms)
- created_at
- Relationships: messages, members
```

                                                  RoomMember Model:

```python
- room_id, user_id
- joined_at
- is_admin (room admin, khác với system admin)
```

                                                    Message Model:

```python
- id, content, sender_id
- room_id (nullable - for room messages)
- receiver_id (nullable - for private messages)
- is_private, is_edited, is_deleted
- created_at
```

──────────────────────────────────────────────────────────────────────────────────────────────────────────────────────

                                                 🎯 4. API ENDPOINTS

                                                  Auth (/api/auth):

 • POST /register - Đăng ký
 • POST /login - Đăng nhập
 • GET /me - Lấy thông tin user hiện tại
 • GET /google - OAuth Google
 • GET /github - OAuth GitHub

                                                 Users (/api/users):

 • GET / - Lấy tất cả users
 • GET /online - Lấy users online
 • GET /{user_id} - Lấy user theo ID
 • PUT /me - Update profile

                                                 Rooms (/api/rooms):

 • POST / - Tạo room (Admin only)
 • GET / - Lấy tất cả public rooms
 • GET /{room_id} - Lấy room theo ID
 • POST /{room_id}/join - Join room
 • POST /{room_id}/leave - Leave room
 • GET /{room_id}/members - Lấy members
 • DELETE /{room_id} - Xóa room (Admin only)

                                              Messages (/api/messages):

 • POST / - Gửi message
 • GET /room/{room_id} - Lấy messages của room
 • GET /private/{user_id} - Lấy private messages

                                                 Admin (/api/admin):

 • GET /stats - Thống kê hệ thống
 • GET /users - Lấy tất cả users (bao gồm inactive)
 • PUT /users/{user_id}/role - Đổi role (Super Admin only)
 • PUT /users/{user_id}/deactivate - Vô hiệu hóa user
 • PUT /users/{user_id}/activate - Kích hoạt user
 • DELETE /users/{user_id} - Xóa user vĩnh viễn (Super Admin only)

                                                 WebSocket (/api/ws):

 • WS /ws?token={jwt_token} - WebSocket connection

──────────────────────────────────────────────────────────────────────────────────────────────────────────────────────

                                              ⚛️ 5. FRONTEND ARCHITECTURE

                                             State Management (Zustand):

authStore:

```javascript
- token, user
- setAuth(token, user)
- logout()
- Persist: localStorage
```

chatStore:

```javascript
- ws, messages, rooms, currentRoom, currentPrivateChat
- onlineUsers, typingUsers
- unreadRooms, unreadPrivateChats
- Actions: setWs, addMessage, setMessages, setCurrentRoom...
```

                                                     Components:

 1 Sidebar.jsx:
    • Hiển thị danh sách channels
    • Create channel (Admin only)
    • Delete channel (Admin only) với confirm
    • Unread badges
    • User panel với logout button
 2 ChatArea.jsx:
    • Hiển thị messages (filtered theo room/private chat)
    • Input box để gửi messages
    • Auto-scroll to bottom
    • Format time (today: "h:mm a", older: "MMM d, h:mm a")
    • Group messages (show avatar khi sender khác người trước)
 3 UserList.jsx:
    • Hiển thị users (sorted: online first)
    • Click để mở private chat
    • Online/Offline indicator
    • "You" badge cho current user
 4 AdminPanel.jsx:
    • Stats dashboard (total users, online, rooms, messages)
    • User management table
    • Role management (Super Admin only)
    • Activate/Deactivate users
    • Delete users (Super Admin only, with confirmation)
    • Role distribution chart

                                                        Pages:

 1 Login.jsx:
    • Username/password login
    • OAuth buttons (Google, GitHub)
    • Link to Register
 2 Register.jsx:
    • Username, email, password, confirm password
    • Auto-login sau khi register thành công
 3 Chat.jsx:
    • Initialize WebSocket connection
    • Load rooms, users, messages
    • Handle WebSocket messages
    • Manage unread tracking
    • Global flags để prevent duplicate initialization

──────────────────────────────────────────────────────────────────────────────────────────────────────────────────────

                                              🔄 6. LUỒNG DỮ LIỆU CHÍNH

                                                Sending Message Flow:

```
1. User nhập message → nhấn Send
2. ChatArea gọi ws.sendMessage(content, room_id/receiver_id)
3. WebSocket gửi {type: "chat_message", content, ...}
4. Backend nhận → save to DB → broadcast
5. Frontend nhận WebSocket message → addMessage to store
6. ChatArea re-render với message mới
7. Auto-scroll to bottom
```

                                                 Room Deletion Flow:

```
1. Admin click Delete → confirm dialog
2. Frontend gọi DELETE /api/rooms/{id}
3. Backend: xóa members → xóa messages → xóa room
4. Backend broadcast "room_deleted" qua WebSocket
5. All clients nhận → refresh rooms list
6. Nếu đang ở room bị xóa → clear currentRoom
```

                                                 Online Status Flow:

```
1. User connect WebSocket → set is_online=True
2. Broadcast user_status to all clients
3. All clients update onlineUsers array
4. UserList re-render với status mới
5. User disconnect → set is_online=False → broadcast
```

──────────────────────────────────────────────────────────────────────────────────────────────────────────────────────

                                              🛡️ 7. SECURITY & VALIDATION

 1 Authentication:
    • JWT với expiration (30 phút)
    • Password hashing với bcrypt
    • OAuth ID verification
 2 Authorization:
    • Role-based access control
    • Admin checks cho create/delete room
    • Super Admin only cho role changes
    • Cannot change own role/delete self
 3 Input Validation:
    • Pydantic schemas cho request validation
    • Email validation
    • Unique username/email checks
    • Room name uniqueness
 4 WebSocket Security:
    • Token authentication trước khi accept connection
    • Close connection nếu invalid token

──────────────────────────────────────────────────────────────────────────────────────────────────────────────────────

                                                📝 8. NOTABLE FEATURES

 1 Multi-device Support:
    • Một user có thể connect từ nhiều devices
    • active_connections[user_id] là array of WebSocket
 2 Unread Tracking:
    • Track unread per room và per private chat
    • Clear khi switch to that room/chat
    • Display badges trong Sidebar và UserList
 3 Prevent Duplicate Initialization:
    • Global flags isInitializing, isInitialized
    • Prevent React StrictMode double-init issue
 4 Room Admin vs System Admin:
    • RoomMember.is_admin: admin của room cụ thể
    • User.role: system-wide permissions
 5 OAuth Username Handling:
    • Auto-generate unique username nếu trùng
    • Format: {base_username}{counter}