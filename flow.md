# 📊 LUỒNG XỬ LÝ DỰ ÁN FIRST-CHAT

> **Tài liệu mô tả chi tiết các luồng xử lý trong ứng dụng chat real-time**  
> Version: 2.0 | Cập nhật: 2026-03-10

---

## 📋 MỤC LỤC

1. [Tổng quan kiến trúc](#1-tổng-quan-kiến-trúc)
2. [Authentication Flow](#2-authentication-flow)
3. [Server Management Flow](#3-server-management-flow)
4. [Channel Management Flow](#4-channel-management-flow)
5. [Messaging Flow](#5-messaging-flow)
6. [Member Management Flow](#6-member-management-flow)
7. [WebSocket Events](#7-websocket-events)
8. [Error Handling](#8-error-handling)

---

## 1. TỔNG QUAN KIẾN TRÚC

### 1.1 Tech Stack

**Frontend:**
- React 18 + Vite
- Socket.IO Client (Real-time WebSocket)
- React Router v6 (Routing)
- Axios (HTTP Client)

**Backend:**
- FastAPI (Python Web Framework)
- SQLAlchemy (ORM)
- Socket.IO (WebSocket Server)
- PostgreSQL (Database)
- Alembic (Database Migrations)
- JWT (Authentication)

### 1.2 Kiến trúc 3-tier

```
┌──────────────────────┐
│   PRESENTATION       │
│   React Frontend     │  Port: 5173
│   - UI Components    │
│   - State Management │
│   - WebSocket Client │
└──────────┬───────────┘
           │ HTTP/WebSocket
           ▼
┌──────────────────────┐
│   APPLICATION        │
│   FastAPI Backend    │  Port: 8000
│   - REST API         │
│   - Business Logic   │
│   - WebSocket Server │
│   - Authentication   │
└──────────┬───────────┘
           │ SQL
           ▼
┌──────────────────────┐
│   DATA LAYER         │
│   PostgreSQL DB      │  Port: 5432
│   - User Data        │
│   - Messages         │
│   - Relationships    │
└──────────────────────┘
```

---

## 2. AUTHENTICATION FLOW

### 2.1 Đăng ký (Registration)

```mermaid
sequenceDiagram
    participant U as User
    participant F as Frontend
    participant B as Backend
    participant D as Database

    U->>F: Nhập thông tin đăng ký
    F->>F: Validate form
    F->>B: POST /api/auth/register
    B->>B: Validate data
    B->>D: Kiểm tra email/username
    alt Email/Username đã tồn tại
        D-->>B: Conflict
        B-->>F: 400 Error
        F-->>U: Hiển thị lỗi
    else Thành công
        D-->>B: OK
        B->>B: Hash password (bcrypt)
        B->>D: INSERT user
        B->>B: Generate JWT token
        B-->>F: Return token + user info
        F->>F: Lưu token vào localStorage
        F-->>U: Redirect to /channels/@me
    end
```

**Request:**
```http
POST /api/auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "username": "john_doe",
  "display_name": "John Doe",
  "password": "securepassword123"
}
```

**Response:**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer",
  "user": {
    "id": 1,
    "email": "user@example.com",
    "username": "john_doe",
    "display_name": "John Doe",
    "created_at": "2026-03-10T10:00:00Z"
  }
}
```

### 2.2 Đăng nhập (Login)

```mermaid
sequenceDiagram
    participant U as User
    participant F as Frontend
    participant B as Backend
    participant D as Database

    U->>F: Nhập username/email + password
    F->>B: POST /api/auth/login
    B->>D: Query user
    alt User không tồn tại
        D-->>B: Not found
        B-->>F: 401 Unauthorized
        F-->>U: "Invalid credentials"
    else User tồn tại
        D-->>B: Return user
        B->>B: Verify password
        alt Password sai
            B-->>F: 401 Unauthorized
            F-->>U: "Invalid credentials"
        else Password đúng
            B->>B: Generate JWT token
            B-->>F: Return token + user info
            F->>F: Lưu token
            F-->>U: Redirect to /channels/@me
        end
    end
```

**Request:**
```http
POST /api/auth/login
Content-Type: application/json

{
  "username": "john_doe",
  "password": "securepassword123"
}
```

### 2.3 Verify Token

Mỗi request cần authentication sẽ gửi token trong header:

```http
GET /api/servers
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

Backend verify token:
1. Extract token từ header
2. Decode JWT
3. Kiểm tra expiration
4. Lấy user_id từ payload
5. Query user từ database

---

## 3. SERVER MANAGEMENT FLOW

### 3.1 Tạo Server

```mermaid
sequenceDiagram
    participant U as User
    participant F as Frontend
    participant B as Backend
    participant D as Database
    participant W as WebSocket

    U->>F: Click "Create Server"
    U->>F: Nhập tên server
    F->>B: POST /api/servers
    B->>D: INSERT server
    B->>D: INSERT default channel "general"
    B->>D: INSERT owner vào server_members
    D-->>B: Success
    B-->>F: Return server data
    F->>F: Update local state
    W->>F: Emit "server_created"
    F-->>U: Hiển thị server mới
```

**Chi tiết Backend:**

```python
# 1. Tạo server
server = Server(
    name=data.name,
    owner_id=current_user.id,
    invite_code=generate_invite_code()  # Random 8 ký tự
)
db.add(server)

# 2. Tạo channel mặc định
default_channel = Channel(
    name="general",
    server_id=server.id,
    type="text"
)
db.add(default_channel)

# 3. Thêm owner vào members
member = ServerMember(
    user_id=current_user.id,
    server_id=server.id,
    role="owner"
)
db.add(member)

db.commit()
```

### 3.2 Join Server (Invite Code)

```mermaid
sequenceDiagram
    participant U as User
    participant F as Frontend
    participant B as Backend
    participant D as Database

    U->>F: Nhập invite code
    F->>B: POST /api/servers/join
    B->>D: Query server by invite_code
    alt Server không tồn tại
        D-->>B: Not found
        B-->>F: 404 Error
        F-->>U: "Invalid invite code"
    else Server tồn tại
        D-->>B: Return server
        B->>D: Kiểm tra user đã join chưa
        alt Đã là member
            D-->>B: Already exists
            B-->>F: 400 Error
            F-->>U: "Already a member"
        else Chưa join
            B->>D: INSERT server_member
            D-->>B: Success
            B-->>F: Return server data
            F->>F: Update state
            F-->>U: Redirect to server
        end
    end
```

### 3.3 Leave Server

```mermaid
sequenceDiagram
    participant U as User
    participant F as Frontend
    participant B as Backend
    participant D as Database
    participant W as WebSocket

    U->>F: Click "Leave Server"
    F->>F: Show confirmation dialog
    U->>F: Confirm
    F->>B: DELETE /api/servers/{id}/leave
    B->>D: Query server
    alt User là owner
        D-->>B: Role = owner
        B-->>F: 403 Forbidden
        F-->>U: "Owner cannot leave"
    else User là member
        B->>D: DELETE server_member
        D-->>B: Success
        B->>W: Emit "member_left"
        B-->>F: Success
        F->>F: Remove server khỏi state
        F-->>U: Redirect to /channels/@me
    end
```

---

## 4. CHANNEL MANAGEMENT FLOW

### 4.1 Tạo Channel

```mermaid
sequenceDiagram
    participant U as User
    participant F as Frontend
    participant B as Backend
    participant D as Database
    participant W as WebSocket

    U->>F: Click "Create Channel"
    U->>F: Nhập tên + chọn type
    F->>B: POST /api/channels
    B->>D: Validate user là member
    B->>D: Kiểm tra tên channel trùng
    alt Tên đã tồn tại
        D-->>B: Duplicate
        B-->>F: 400 Error
        F-->>U: "Channel name exists"
    else Tên chưa tồn tại
        B->>D: INSERT channel
        D-->>B: Success
        B->>W: Broadcast "channel_created" to server room
        W->>F: All members nhận event
        F->>F: Update channels list
        F-->>U: Switch to new channel
    end
```

**Request:**
```http
POST /api/channels
Authorization: Bearer {token}
Content-Type: application/json

{
  "name": "random",
  "server_id": 1,
  "type": "text"
}
```

### 4.2 Xóa Channel

**Điều kiện:**
- User phải có role `admin` hoặc `owner`
- Không thể xóa channel cuối cùng của server
- Không thể xóa channel "general" (nếu được cấu hình)

```mermaid
sequenceDiagram
    participant U as User
    participant F as Frontend
    participant B as Backend
    participant D as Database
    participant W as WebSocket

    U->>F: Click "Delete Channel"
    F->>F: Show confirmation
    U->>F: Confirm
    F->>B: DELETE /api/channels/{id}
    B->>D: Validate permissions
    alt Không có quyền
        D-->>B: Permission denied
        B-->>F: 403 Error
        F-->>U: "No permission"
    else Có quyền
        B->>D: Count channels in server
        alt Là channel cuối cùng
            D-->>B: Count = 1
            B-->>F: 400 Error
            F-->>U: "Cannot delete last channel"
        else Có thể xóa
            B->>D: DELETE channel (CASCADE messages)
            D-->>B: Success
            B->>W: Broadcast "channel_deleted"
            W->>F: All members nhận event
            F->>F: Remove channel, switch to first channel
            F-->>U: Show success
        end
    end
```

---

## 5. MESSAGING FLOW

### 5.1 Gửi tin nhắn (WebSocket)

```mermaid
sequenceDiagram
    participant U as User
    participant F as Frontend
    participant W as WebSocket Server
    participant D as Database
    participant O as Other Users

    U->>F: Nhập message + Enter
    F->>F: Optimistic UI update
    F->>W: Emit "send_message"
    W->>W: Authenticate user
    W->>D: Validate user trong channel
    alt User không có quyền
        D-->>W: Not authorized
        W-->>F: Emit "message_error"
        F->>F: Rollback optimistic update
        F-->>U: Show error
    else User có quyền
        W->>D: INSERT message
        D-->>W: Return message with ID
        W->>W: Broadcast to channel room
        W->>O: Emit "new_message"
        W->>F: Emit "new_message"
        F->>F: Update message với ID từ server
        F-->>U: Message sent successfully
        O->>O: Display new message
    end
```

**WebSocket Event:**
```javascript
// Client gửi
socket.emit('send_message', {
  channel_id: 1,
  content: "Hello world!",
  message_type: "text"
});

// Server broadcast
socket.emit('new_message', {
  id: 123,
  content: "Hello world!",
  message_type: "text",
  channel_id: 1,
  user: {
    id: 1,
    username: "john_doe",
    display_name: "John Doe"
  },
  created_at: "2026-03-10T10:30:00Z"
});
```

### 5.2 Tải lịch sử tin nhắn

```mermaid
sequenceDiagram
    participant U as User
    participant F as Frontend
    participant B as Backend
    participant D as Database

    U->>F: Mở channel
    F->>B: GET /api/channels/{id}/messages?limit=50
    B->>D: Query messages với JOIN users
    D-->>B: Return 50 messages mới nhất
    B-->>F: JSON response
    F->>F: Render messages
    F-->>U: Display chat history

    Note over U,F: Scroll to top
    U->>F: Scroll lên đầu
    F->>F: Detect scroll position
    F->>B: GET /api/channels/{id}/messages?limit=50&before={oldest_id}
    B->>D: Query older messages
    D-->>B: Return older messages
    B-->>F: JSON response
    F->>F: Prepend messages
    F-->>U: Load more messages
```

**Pagination:**
```http
GET /api/channels/1/messages?limit=50&before=100

Response:
{
  "messages": [...],
  "has_more": true,
  "oldest_id": 51
}
```

### 5.3 Typing Indicator

```mermaid
sequenceDiagram
    participant U as User A
    participant F as Frontend A
    participant W as WebSocket
    participant O as User B Frontend

    U->>F: Bắt đầu gõ
    F->>F: Debounce 500ms
    F->>W: Emit "typing_start"
    W->>O: Broadcast "user_typing"
    O->>O: Show "User A is typing..."
    
    Note over U,F: 3 giây không gõ
    F->>F: Timeout
    F->>W: Emit "typing_stop"
    W->>O: Broadcast "user_stopped_typing"
    O->>O: Hide typing indicator
```

**Implementation:**
```javascript
// Frontend
let typingTimeout;

const handleTyping = () => {
  if (!isTyping) {
    socket.emit('typing_start', { channel_id: currentChannel.id });
    isTyping = true;
  }
  
  clearTimeout(typingTimeout);
  typingTimeout = setTimeout(() => {
    socket.emit('typing_stop', { channel_id: currentChannel.id });
    isTyping = false;
  }, 3000);
};
```

---

## 6. MEMBER MANAGEMENT FLOW

### 6.1 Xem danh sách thành viên

```mermaid
sequenceDiagram
    participant U as User
    participant F as Frontend
    participant B as Backend
    participant D as Database

    U->>F: Click "Members" tab
    F->>B: GET /api/servers/{id}/members
    B->>D: Query members với user info
    D-->>B: Return members
    B->>B: Group by role (owner, admin, member)
    B-->>F: JSON response
    F->>F: Render member list
    F-->>U: Display members grouped by role
```

**Response format:**
```json
{
  "members": [
    {
      "user_id": 1,
      "username": "john_doe",
      "display_name": "John Doe",
      "role": "owner",
      "joined_at": "2026-03-01T10:00:00Z"
    },
    {
      "user_id": 2,
      "username": "jane_smith",
      "display_name": "Jane Smith",
      "role": "member",
      "joined_at": "2026-03-05T14:30:00Z"
    }
  ]
}
```

### 6.2 Kick Member

```mermaid
sequenceDiagram
    participant A as Admin
    participant F as Frontend
    participant B as Backend
    participant D as Database
    participant W as WebSocket
    participant M as Kicked Member

    A->>F: Click "Kick" on member
    F->>F: Show confirmation
    A->>F: Confirm
    F->>B: DELETE /api/servers/{server_id}/members/{user_id}
    B->>D: Validate requester role
    
    alt Không có quyền
        D-->>B: Insufficient permission
        B-->>F: 403 Error
        F-->>A: "No permission"
    else Có quyền
        B->>D: Validate target không phải owner
        alt Target là owner
            D-->>B: Cannot kick owner
            B-->>F: 400 Error
            F-->>A: "Cannot kick owner"
        else Có thể kick
            B->>D: DELETE server_member
            D-->>B: Success
            B->>W: Broadcast "member_removed"
            W->>M: Emit "you_were_kicked"
            W->>F: Update member list
            M->>M: Remove server khỏi UI
            F->>F: Remove member khỏi list
            B-->>F: Success
            F-->>A: "Member kicked"
        end
    end
```

---

## 7. WEBSOCKET EVENTS

### 7.1 Connection & Authentication

**Client kết nối:**
```javascript
const socket = io('http://localhost:8000', {
  auth: {
    token: localStorage.getItem('token')
  },
  transports: ['websocket']
});

socket.on('connect', () => {
  console.log('Connected:', socket.id);
});

socket.on('connect_error', (error) => {
  console.error('Connection error:', error);
});
```

**Server authenticate:**
```python
@socketio.on('connect')
def handle_connect(auth):
    token = auth.get('token')
    
    try:
        user = verify_jwt_token(token)
    except:
        return False  # Reject connection
    
    # Lưu user vào session
    session['user_id'] = user.id
    
    # Join personal room
    join_room(f'user_{user.id}')
    
    # Join tất cả server rooms
    for server in user.servers:
        join_room(f'server_{server.id}')
        
        # Join tất cả channel rooms
        for channel in server.channels:
            join_room(f'channel_{channel.id}')
    
    emit('connected', {'user_id': user.id})
```

### 7.2 Event Reference

| Event | Direction | Payload | Description |
|-------|-----------|---------|-------------|
| `connect` | C → S | `{ auth: { token } }` | Kết nối WebSocket |
| `disconnect` | C → S | - | Ngắt kết nối |
| `send_message` | C → S | `{ channel_id, content, type }` | Gửi tin nhắn |
| `new_message` | S → C | `{ id, content, user, ... }` | Tin nhắn mới |
| `typing_start` | C → S | `{ channel_id }` | Bắt đầu typing |
| `typing_stop` | C → S | `{ channel_id }` | Dừng typing |
| `user_typing` | S → C | `{ user_id, username, channel_id }` | User đang typing |
| `channel_created` | S → C | `{ channel }` | Channel mới |
| `channel_deleted` | S → C | `{ channel_id }` | Channel bị xóa |
| `member_joined` | S → C | `{ user, server_id }` | Member join |
| `member_removed` | S → C | `{ user_id, server_id }` | Member kicked |
| `you_were_kicked` | S → C | `{ server_id }` | Bạn bị kick |

### 7.3 Room Structure

```
user_{user_id}           → Personal notifications
server_{server_id}       → Server-wide events
channel_{channel_id}     → Channel messages & typing
```

**Ví dụ broadcast:**
```python
# Gửi tới tất cả users trong channel
emit('new_message', message_data, room=f'channel_{channel_id}')

# Gửi tới tất cả users trong server
emit('member_joined', member_data, room=f'server_{server_id}')

# Gửi tới 1 user cụ thể
emit('you_were_kicked', data, room=f'user_{user_id}')
```

---

## 8. ERROR HANDLING

### 8.1 HTTP Error Responses

**400 Bad Request:**
```json
{
  "detail": "Validation error",
  "errors": [
    {
      "field": "email",
      "message": "Email already exists"
    }
  ]
}
```

**401 Unauthorized:**
```json
{
  "detail": "Could not validate credentials"
}
```

**403 Forbidden:**
```json
{
  "detail": "You don't have permission to perform this action"
}
```

**404 Not Found:**
```json
{
  "detail": "Resource not found"
}
```

**500 Internal Server Error:**
```json
{
  "detail": "An unexpected error occurred",
  "error_id": "abc123"
}
```

### 8.2 Frontend Error Handling

```javascript
// Axios interceptor
axios.interceptors.response.use(
  response => response,
  error => {
    if (error.response) {
      switch (error.response.status) {
        case 401:
          // Clear token và redirect
          localStorage.removeItem('token');
          window.location.href = '/login';
          break;
          
        case 403:
          showNotification('You don\'t have permission', 'error');
          break;
          
        case 404:
          showNotification('Resource not found', 'error');
          break;
          
        case 500:
          showNotification('Server error, please try again', 'error');
          break;
      }
    }
    return Promise.reject(error);
  }
);

// WebSocket error handling
socket.on('error', (error) => {
  console.error('WebSocket error:', error);
  showNotification('Connection error', 'error');
});

socket.on('connect_error', () => {
  showNotification('Cannot connect to server', 'error');
});
```

### 8.3 Backend Error Handling

```python
# Custom exceptions
class AuthenticationError(Exception):
    pass

class PermissionDeniedError(Exception):
    pass

# Error handlers
@app.exception_handler(AuthenticationError)
async def auth_error_handler(request, exc):
    return JSONResponse(
        status_code=401,
        content={"detail": str(exc)}
    )

@app.exception_handler(PermissionDeniedError)
async def permission_error_handler(request, exc):
    return JSONResponse(
        status_code=403,
        content={"detail": str(exc)}
    )
```

---

## 📚 PHỤ LỤC

### Database Schema Summary

```sql
users (id, email*, username*, display_name, hashed_password, created_at)
servers (id, name, owner_id→users, invite_code*, created_at)
channels (id, name, server_id→servers, type, created_at)
messages (id, content, user_id→users, channel_id→channels, type, created_at)
server_members (id, user_id→users, server_id→servers, role, joined_at)
  UNIQUE(user_id, server_id)

* = UNIQUE constraint
→ = FOREIGN KEY
```

### API Endpoints Summary

```
Authentication:
  POST   /api/auth/register
  POST   /api/auth/login
  GET    /api/auth/me

Servers:
  GET    /api/servers
  POST   /api/servers
  GET    /api/servers/{id}
  PUT    /api/servers/{id}
  DELETE /api/servers/{id}
  POST   /api/servers/join
  GET    /api/servers/{id}/members
  DELETE /api/servers/{id}/members/{user_id}
  DELETE /api/servers/{id}/leave

Channels:
  POST   /api/channels
  GET    /api/channels/{id}
  PUT    /api/channels/{id}
  DELETE /api/channels/{id}
  GET    /api/channels/{id}/messages

Messages:
  GET    /api/messages/{id}
  PUT    /api/messages/{id}
  DELETE /api/messages/{id}
```

---

**📝 Lưu ý:**
- Tài liệu này mô tả luồng xử lý ở mức logic, không phải implementation chi tiết
- Tham khảo source code để biết implementation cụ thể
- WebSocket events có thể được mở rộng thêm tùy theo tính năng

**🔗 Tài liệu liên quan:**
- [README.md](README.md) - Hướng dẫn cài đặt và chạy
- [ARCHITECTURE.md](ARCHITECTURE.md) - Kiến trúc hệ thống chi tiết
- [TEST.md](TEST.md) - Hướng dẫn testing

