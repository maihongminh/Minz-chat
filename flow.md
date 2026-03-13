# 📊 LUỒNG XỬ LÝ DỰ ÁN FIRST-CHAT

> **Tài liệu mô tả chi tiết các luồng xử lý trong ứng dụng chat real-time**  
> Version: 2.2 | Cập nhật: 2026-03-11

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
9. [Tính năng bổ sung](#9-tính-năng-bổ-sung)
   - 9.1 [Unread Badge](#91-unread-badge-đếm-tin-nhắn-chưa-đọc)
   - 9.2 [Typing Indicator](#92-typing-indicator-hiển-thị-đang-gõ)
   - 9.3 [Read Receipts](#93-read-receipts-xác-nhận-đã-xem-tin-nhắn)
   - 9.4 [Tích hợp các tính năng](#94-tích-hợp-các-tính-năng)
   - 9.5 [User Profile Settings](#95-user-profile-settings-quản-lý-hồ-sơ-người-dùng)
   - 9.6 [File & Image Upload](#96-file--image-upload-gửi-file-và-ảnh)

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

## 9. TÍNH NĂNG BỔ SUNG

### 9.1 Unread Badge (Đếm tin nhắn chưa đọc)

**Mục đích:** Hiển thị số lượng tin nhắn chưa đọc cho từng channel và private chat

```mermaid
sequenceDiagram
    participant U as User
    participant F as Frontend
    participant W as WebSocket
    participant S as Store

    Note over F,S: User đang xem Channel A
    
    W->>F: new_message (Channel B)
    F->>F: Check if message from current view
    alt Message từ channel khác
        F->>S: incrementUnreadRoom(channelB.id)
        S->>S: unreadRooms[channelB.id]++
        F->>F: Update badge UI
    end
    
    U->>F: Click vào Channel B
    F->>S: setCurrentRoom(channelB)
    S->>S: Clear unreadRooms[channelB.id]
    F->>F: Badge biến mất
```

**Implementation:**

```javascript
// Store state
const useChatStore = create((set) => ({
  unreadRooms: {},        // { roomId: count }
  unreadPrivateChats: {}, // { userId: count }
  
  incrementUnreadRoom: (roomId) => set((state) => ({
    unreadRooms: {
      ...state.unreadRooms,
      [roomId]: (state.unreadRooms[roomId] || 0) + 1
    }
  })),
  
  clearUnreadRoom: (roomId) => set((state) => {
    const unreadRooms = { ...state.unreadRooms }
    delete unreadRooms[roomId]
    return { unreadRooms }
  })
}))

// Auto clear badge khi:
// 1. Click vào channel/user
// 2. Click vào chat area
// 3. Focus vào message input
// 4. Gửi tin nhắn
```

**UI Display:**
```jsx
<div className="channel-item">
  <span>{channel.name}</span>
  {unreadCount > 0 && (
    <span className="unread-badge">{unreadCount}</span>
  )}
</div>
```

### 9.2 Typing Indicator (Hiển thị đang gõ)

**Mục đích:** Hiển thị khi user đang gõ tin nhắn trong real-time

```mermaid
sequenceDiagram
    participant A as User A
    participant FA as Frontend A
    participant W as WebSocket Server
    participant FB as Frontend B
    participant B as User B

    A->>FA: Bắt đầu gõ tin nhắn
    FA->>FA: Check isTyping flag
    FA->>W: emit('typing', { is_typing: true, room_id })
    W->>FB: broadcast('typing', { user_id: A, username: 'User A' })
    FB->>FB: Store typing state
    FB->>B: Hiển thị "User A is typing..."
    
    Note over A,FA: 2 giây không gõ
    FA->>FA: Timeout trigger
    FA->>W: emit('typing', { is_typing: false, room_id })
    W->>FB: broadcast('typing', { user_id: A, is_typing: false })
    FB->>FB: Clear typing state
    FB->>B: Ẩn typing indicator
```

**WebSocket Events:**

| Event | Direction | Payload | Description |
|-------|-----------|---------|-------------|
| `typing` | C → S | `{ is_typing, room_id?, receiver_id? }` | Gửi trạng thái typing |
| `typing` | S → C | `{ user_id, username, is_typing, room_id?, receiver_id? }` | Nhận trạng thái typing |

**Backend Handler:**
```python
@socketio.on('typing')
def handle_typing(data):
    room_id = data.get('room_id')
    receiver_id = data.get('receiver_id')
    is_typing = data.get('is_typing', False)
    
    typing_data = {
        'user_id': session['user_id'],
        'username': current_user.username,
        'is_typing': is_typing,
        'room_id': room_id,
        'receiver_id': receiver_id
    }
    
    if room_id:
        # Broadcast to room
        emit('typing', typing_data, room=f'room_{room_id}', include_self=False)
    elif receiver_id:
        # Send to specific user
        emit('typing', typing_data, room=f'user_{receiver_id}')
```

**Frontend Implementation:**
```javascript
const [isTyping, setIsTyping] = useState(false)
const typingTimeoutRef = useRef(null)

const handleInputChange = (e) => {
  setMessageInput(e.target.value)
  
  if (!isTyping) {
    setIsTyping(true)
    ws.sendTyping(true, currentRoom?.id, currentPrivateChat?.id)
  }
  
  // Clear previous timeout
  clearTimeout(typingTimeoutRef.current)
  
  // Auto stop after 2 seconds
  typingTimeoutRef.current = setTimeout(() => {
    setIsTyping(false)
    ws.sendTyping(false, currentRoom?.id, currentPrivateChat?.id)
  }, 2000)
}

// UI - Hiển thị ngay trên message input
{typingIndicator && (
  <div className="typing-indicator">
    <span className="typing-text">{typingIndicator}</span>
  </div>
)}
```

### 9.3 Read Receipts (Xác nhận đã xem tin nhắn)

**Mục đích:** Hiển thị ai đã xem tin nhắn (✓ sent, ✓✓ seen)

```mermaid
sequenceDiagram
    participant A as User A
    participant FA as Frontend A
    participant W as WebSocket
    participant D as Database
    participant FB as Frontend B
    participant B as User B

    A->>FA: Gửi tin nhắn
    FA->>W: send_message
    W->>D: INSERT message
    D-->>W: message_id: 123
    W->>FA: new_message (id: 123)
    FA->>FA: Hiển thị ✓ (sent)
    W->>FB: new_message (id: 123)
    
    B->>FB: Mở chat và xem tin nhắn
    FB->>FB: Delay 500ms
    FB->>W: mark_as_read([123])
    W->>D: INSERT INTO message_reads
    D-->>W: Success
    W->>FA: message_read (message_id: 123, user_id: B)
    FA->>FA: Hiển thị ✓✓ Seen (màu xanh)
```

**Database Schema:**

```sql
CREATE TABLE message_reads (
    message_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    read_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (message_id, user_id),
    FOREIGN KEY (message_id) REFERENCES messages(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX idx_message_reads_message_id ON message_reads(message_id);
CREATE INDEX idx_message_reads_user_id ON message_reads(user_id);
```

**WebSocket Events:**

| Event | Direction | Payload | Description |
|-------|-----------|---------|-------------|
| `mark_as_read` | C → S | `{ message_ids: [123, 124] }` | Đánh dấu đã đọc |
| `message_read` | S → C | `{ message_id, user_id, username, read_at }` | Thông báo đã đọc |

**Backend Handler:**
```python
@socketio.on('mark_as_read')
def handle_mark_as_read(data):
    message_ids = data.get('message_ids', [])
    user_id = session['user_id']
    
    for msg_id in message_ids:
        message = Message.query.get(msg_id)
        if message and message.sender_id != user_id:
            # Check if already marked
            existing = db.session.query(message_reads).filter_by(
                message_id=msg_id,
                user_id=user_id
            ).first()
            
            if not existing:
                # Insert read receipt
                db.session.execute(
                    message_reads.insert().values(
                        message_id=msg_id,
                        user_id=user_id
                    )
                )
                db.session.commit()
                
                # Notify sender
                receipt_data = {
                    'message_id': msg_id,
                    'user_id': user_id,
                    'username': current_user.username,
                    'read_at': datetime.utcnow().isoformat()
                }
                
                emit('message_read', receipt_data, 
                     room=f'user_{message.sender_id}')
                
                # Also broadcast to room if room message
                if message.room_id:
                    emit('message_read', receipt_data,
                         room=f'room_{message.room_id}')
```

**API Response (khi load messages):**
```json
{
  "id": 123,
  "content": "Hello!",
  "sender_id": 1,
  "sender_username": "john_doe",
  "room_id": 5,
  "created_at": "2026-03-11T10:00:00Z",
  "read_by": [2, 3, 5]  // Array of user IDs who read this message
}
```

**Frontend Display:**
```javascript
// Hiển thị read receipt
const ReadReceipt = ({ message, currentUserId, readReceipts }) => {
  if (message.sender_id !== currentUserId) return null
  
  const readBy = readReceipts[message.id] || []
  const readCount = readBy.filter(id => id !== currentUserId).length
  
  if (readCount > 0) {
    return <span className="seen-indicator">✓✓ Seen</span>
  }
  return <span className="sent-indicator">✓</span>
}

// Auto mark as read khi xem
useEffect(() => {
  if (!ws || !user) return
  
  const unreadMessageIds = filteredMessages
    .filter(msg => msg.sender_id !== user.id)
    .filter(msg => {
      const readBy = messageReadReceipts[msg.id] || []
      return !readBy.includes(user.id)
    })
    .map(msg => msg.id)
  
  if (unreadMessageIds.length > 0) {
    const timeout = setTimeout(() => {
      ws.markAsRead(unreadMessageIds)
    }, 500)
    
    return () => clearTimeout(timeout)
  }
}, [filteredMessages, ws, user, messageReadReceipts])
```

**CSS Styling:**
```css
.read-receipt {
  display: inline-block;
  margin-left: 8px;
  font-size: 11px;
}

.seen-indicator {
  color: #00a8ff;  /* Màu xanh khi seen */
  font-weight: 600;
}

.sent-indicator {
  color: var(--text-muted);  /* Màu xám khi chỉ gửi */
}
```

### 9.4 Tích hợp các tính năng

**Luồng hoàn chỉnh khi gửi và nhận tin nhắn:**

1. **User A gửi tin nhắn:**
   - Frontend hiển thị optimistic UI với ✓
   - WebSocket gửi message đến server
   - Server lưu DB và broadcast

2. **User B (đang ở channel khác) nhận tin:**
   - Badge tăng lên +1
   - Không mark as read (chưa xem)

3. **User B click vào channel:**
   - Badge tự động clear
   - Load messages với read_by array
   - Sau 500ms auto gửi mark_as_read

4. **User B đang gõ phản hồi:**
   - User A thấy "User B is typing..."
   - Sau 2s không gõ → typing indicator biến mất

5. **User B gửi tin phản hồi:**
   - User A nhận message mới
   - User A's message hiển thị ✓✓ Seen (màu xanh)

---

### 9.5 User Profile Settings (Quản lý hồ sơ người dùng)

> **Mục đích:** Cho phép user quản lý thông tin cá nhân, đổi avatar, đổi mật khẩu

#### 9.5.1 Hiển thị Profile Button

**Frontend (Sidebar.jsx):**
```jsx
// Trong user-actions section (thay thế Admin Panel cho user thường)
{user?.role === 'ADMIN' && (
  <button className="btn-admin-panel" onClick={handleAdminPanelClick}>
    <FaCog /> Admin Panel
  </button>
)}

{/* Tất cả user đều có Profile Settings */}
<button className="btn-profile" onClick={openProfile}>
  <FaUser /> Profile Settings
</button>
```

**Logic phân quyền:**
- **Admin**: Hiển thị cả "Admin Panel" và "Profile Settings"
- **User thường**: Chỉ hiển thị "Profile Settings"

---

#### 9.5.2 View Profile (Xem thông tin)

**Luồng xử lý:**

```
User click "Profile Settings"
    ↓
Frontend mở Profile Modal
    ↓
Hiển thị thông tin từ current user state:
    - Avatar (từ avatar_url hoặc default icon)
    - Username (không thể thay đổi)
    - Email (không thể thay đổi)
    - Full Name (có thể thay đổi)
    - Role (chỉ xem)
    ↓
User có 3 options:
    1. Edit Profile (đổi tên/avatar)
    2. Change Password
    3. Close modal
```

**Frontend Component:**
```jsx
const [showProfile, setShowProfile] = useState(false);

const openProfile = () => {
  setShowProfile(true);
};

// Profile Modal hiển thị
<div className="profile-modal">
  <div className="profile-avatar-wrapper">
    {user?.avatar_url ? (
      <img src={user.avatar_url} alt="Avatar" />
    ) : (
      <FaUserCircle className="profile-avatar-large" />
    )}
  </div>
  <div className="profile-info">
    <p><strong>Username:</strong> {user?.username}</p>
    <p><strong>Email:</strong> {user?.email}</p>
    <p><strong>Full Name:</strong> {user?.full_name || 'Not set'}</p>
    <p><strong>Role:</strong> {user?.role}</p>
  </div>
  <div className="profile-actions">
    <button onClick={openEditProfile}>Edit Profile</button>
    <button onClick={openChangePassword}>Change Password</button>
  </div>
</div>
```

---

#### 9.5.3 Edit Profile (Đổi tên & Avatar)

**Luồng xử lý:**

```
User click "Edit Profile"
    ↓
Frontend mở Edit Profile Modal
    ↓
User có thể:
    1. Upload avatar mới (chọn file ảnh)
    2. Thay đổi Full Name
    ↓
User click "Save Changes"
    ↓
Frontend validate input
    ↓
Convert avatar to base64 (nếu có upload)
    ↓
PUT /api/users/me
    Headers: { Authorization: "Bearer {token}" }
    Body: {
      full_name: "New Name",
      avatar_url: "data:image/jpeg;base64,..." // hoặc null
    }
    ↓
Backend (users.py):
    - get_current_user() → verify JWT token
    - Validate input (UserUpdate schema)
    - Cập nhật user.full_name (nếu có)
    - Cập nhật user.avatar_url (nếu có)
    - db.commit()
    - Return updated user info
    ↓
Frontend nhận response:
    - Cập nhật user state
    - Đóng modal
    - Hiển thị success message
    - Avatar/name mới hiển thị trong sidebar ngay lập tức
```

**Backend API:**
```python
# backend/app/api/users.py

@router.put("/me", response_model=UserResponse)
async def update_current_user(
    user_update: UserUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Cập nhật thông tin user hiện tại
    - full_name: Tên đầy đủ (optional)
    - avatar_url: Base64 image hoặc URL (optional)
    """
    if user_update.full_name is not None:
        current_user.full_name = user_update.full_name
    
    if user_update.avatar_url is not None:
        current_user.avatar_url = user_update.avatar_url
    
    db.commit()
    db.refresh(current_user)
    
    return current_user
```

**Frontend Service:**
```javascript
// frontend/src/services/api.js

export const usersAPI = {
  updateProfile: async (data) => {
    const response = await api.put('/users/me', data);
    return response.data;
  },
};
```

**Frontend Handler:**
```jsx
const handleAvatarChange = (e) => {
  const file = e.target.files[0];
  if (file) {
    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      alert('File size must be less than 2MB');
      return;
    }
    
    // Convert to base64
    const reader = new FileReader();
    reader.onloadend = () => {
      setEditedAvatar(reader.result); // data:image/jpeg;base64,...
    };
    reader.readAsDataURL(file);
  }
};

const handleSaveProfile = async () => {
  try {
    const updateData = {
      full_name: editedFullName || user.full_name,
      avatar_url: editedAvatar || user.avatar_url
    };
    
    const updatedUser = await usersAPI.updateProfile(updateData);
    setUser(updatedUser);
    setShowEditProfile(false);
    alert('Profile updated successfully!');
  } catch (error) {
    alert('Failed to update profile: ' + error.response?.data?.detail);
  }
};
```

---

#### 9.5.4 Change Password (Đổi mật khẩu)

**Luồng xử lý:**

```
User click "Change Password"
    ↓
Frontend mở Change Password Modal
    ↓
User nhập:
    - Current Password (required)
    - New Password (required, min 6 chars)
    - Confirm New Password (required, must match)
    ↓
Frontend validate:
    - Tất cả fields đều required
    - New password ≠ Current password
    - New password === Confirm password
    - New password length >= 6
    ↓
POST /api/users/me/change-password
    Headers: { Authorization: "Bearer {token}" }
    Body: {
      current_password: "old_pass",
      new_password: "new_pass"
    }
    ↓
Backend (users.py):
    - get_current_user() → verify JWT token
    - Validate PasswordChange schema
    - verify_password(current_password, user.hashed_password)
        → Nếu sai: HTTPException 400 "Incorrect current password"
    - Hash new_password
    - user.hashed_password = new_hash
    - db.commit()
    - Return success message
    ↓
Frontend nhận response:
    - Hiển thị success message
    - Đóng modal
    - Clear form
    - (Optional) Auto logout và yêu cầu đăng nhập lại
```

**Backend API:**
```python
# backend/app/api/users.py

@router.post("/me/change-password")
async def change_password(
    password_data: PasswordChange,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Đổi mật khẩu cho user hiện tại
    - Verify current password
    - Hash và lưu new password
    """
    # Verify current password
    if not verify_password(password_data.current_password, current_user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Incorrect current password"
        )
    
    # Hash new password
    current_user.hashed_password = get_password_hash(password_data.new_password)
    db.commit()
    
    return {"message": "Password changed successfully"}
```

**Backend Schema:**
```python
# backend/app/schemas/user.py

class PasswordChange(BaseModel):
    current_password: str
    new_password: str = Field(..., min_length=6)
```

**Frontend Handler:**
```jsx
const handleChangePassword = async () => {
  // Validation
  if (!currentPassword || !newPassword || !confirmPassword) {
    alert('All fields are required');
    return;
  }
  
  if (newPassword !== confirmPassword) {
    alert('New passwords do not match');
    return;
  }
  
  if (newPassword.length < 6) {
    alert('New password must be at least 6 characters');
    return;
  }
  
  if (newPassword === currentPassword) {
    alert('New password must be different from current password');
    return;
  }
  
  try {
    await usersAPI.changePassword({
      current_password: currentPassword,
      new_password: newPassword
    });
    
    alert('Password changed successfully!');
    setShowChangePassword(false);
    
    // Clear form
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
  } catch (error) {
    const errorMsg = error.response?.data?.detail || 'Failed to change password';
    alert(errorMsg);
  }
};
```

---

#### 9.5.5 Security Considerations

**Password Security:**
- ✅ Backend hash password với bcrypt (cost factor 12)
- ✅ Frontend không lưu password ở bất kỳ đâu
- ✅ Validate current password trước khi cho phép đổi
- ✅ Minimum password length: 6 characters (có thể tăng lên 8+)

**Avatar Upload:**
- ✅ Convert image to base64 (lưu trực tiếp trong DB)
- ✅ Giới hạn file size: Max 2MB
- ✅ Accept formats: image/jpeg, image/png, image/gif
- ⚠️ **Future improvement**: Upload to S3/Cloud Storage thay vì base64 trong DB

**Authorization:**
- ✅ Tất cả endpoints yêu cầu JWT token
- ✅ User chỉ có thể cập nhật profile của chính mình
- ✅ Backend verify token với `get_current_user()` dependency

---

#### 9.5.6 UI/UX Features

**Profile Modal:**
- Avatar hiển thị lớn (150px)
- Thông tin user rõ ràng, dễ đọc
- Buttons "Edit Profile" và "Change Password" nổi bật

**Edit Profile Modal:**
- Preview avatar real-time khi upload
- Input field cho Full Name với giá trị hiện tại
- Button "Change Avatar" trigger file input
- Success/Error messages rõ ràng

**Change Password Modal:**
- 3 input fields: Current, New, Confirm
- Password visibility toggle (show/hide)
- Validation messages inline
- Disable submit button khi đang xử lý

**Responsive Design:**
- Modal center screen trên mọi kích thước màn hình
- Touch-friendly buttons (min 44px height)
- Proper spacing và typography

---

### 9.6 File & Image Upload (Gửi file và ảnh)

> **Mục đích:** Cho phép user gửi ảnh, file đính kèm trong tin nhắn

#### 9.6.1 Database Schema

**Thêm columns vào bảng `messages`:**
```sql
ALTER TABLE messages ADD COLUMN:
  file_url VARCHAR(TEXT)     -- Base64 encoded file data hoặc URL
  file_name VARCHAR(255)     -- Tên file gốc
  file_type VARCHAR(100)     -- MIME type (image/jpeg, application/pdf, etc.)
```

**Model Update:**
```python
# backend/app/models/message.py
class Message(Base):
    # ... existing fields
    file_url = Column(Text, nullable=True)
    file_name = Column(String(255), nullable=True)
    file_type = Column(String(100), nullable=True)
```

---

#### 9.6.2 File Upload Flow (Single & Multiple Files)

**Luồng xử lý Single File (Legacy):**

```
User click attach button (📎)
    ↓
File picker mở (accept: image/*, .pdf, .doc, .txt)
    ↓
User chọn 1 file
    ↓
Frontend validate:
    - File size <= 5MB
    - File type allowed
    ↓
Nếu là image:
    - Tạo preview (max 200x200px)
    - Hiển thị trong upload UI
Nếu là file khác:
    - Hiển thị tên file + size
    ↓
User nhập text (optional) và click Send
    ↓
Convert file to base64 và gửi qua WebSocket
```

**Luồng xử lý Multiple Files (NEW - v2.0):**

```
User click attach button (📎)
    ↓
File picker mở với multiple attribute
    ↓
User chọn nhiều files (Hold Ctrl/Cmd để chọn 2-5 files)
    ↓
Frontend validate:
    - Tối đa 5 files
    - Mỗi file <= 5MB
    - File types allowed
    ↓
Hiển thị preview grid:
    - Images: Thumbnails 80x80px
    - Documents: File icons + names
    - Mỗi file có nút X để remove
    ↓
User có thể:
    - Remove từng file riêng lẻ
    - Thêm message text (optional)
    ↓
Click Send
    ↓
Convert tất cả files to base64:
    const attachmentsPromises = selectedFiles.map(file => {
      return new Promise((resolve) => {
        const reader = new FileReader()
        reader.onloadend = () => {
          resolve({
            file_url: reader.result,
            file_name: file.name,
            file_type: file.type,
            file_size: file.size
          })
        }
        reader.readAsDataURL(file)
      })
    })
    
    Promise.all(attachmentsPromises).then(attachments => {
      ws.sendMessage(content, room_id, receiver_id, null, null, null, attachments)
    })
    ↓
WebSocket send message với attachments array:
    {
      type: 'chat_message',
      content: 'Optional text',
      room_id: 123,
      receiver_id: null,
      attachments: [
        {file_url: 'base64...', file_name: 'img1.jpg', file_type: 'image/jpeg', file_size: 12345},
        {file_url: 'base64...', file_name: 'doc.pdf', file_type: 'application/pdf', file_size: 45678}
      ]
    }
    ↓
Backend nhận và xử lý:
    - Tạo Message record
    - Tạo nhiều Attachment records (1 cho mỗi file)
    - Lưu vào bảng attachments với foreign key đến message
    - Broadcast message với attachments array
    ↓
Recipients nhận message:
    - Hiển thị attachments dạng grid layout
    - Images: Hiển thị thumbnails, click để xem full
    - Documents: Hiển thị icons, click để download
```

---

#### 9.6.3 Backend Implementation

**Database Schema (v2.0 - Multiple Files Support):**

```sql
-- New attachments table
CREATE TABLE attachments (
    id SERIAL PRIMARY KEY,
    message_id INTEGER NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
    file_url TEXT NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    file_type VARCHAR(100) NOT NULL,
    file_size BIGINT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_attachments_message_id ON attachments(message_id);

-- Messages table keeps legacy fields for backward compatibility
-- file_url, file_name, file_type (for single file support)
```

**Model Definition:**
```python
# backend/app/models/attachment.py
class Attachment(Base):
    __tablename__ = "attachments"
    
    id = Column(Integer, primary_key=True, index=True)
    message_id = Column(Integer, ForeignKey("messages.id"), nullable=False)
    file_url = Column(Text, nullable=False)
    file_name = Column(String(255), nullable=False)
    file_type = Column(String(100), nullable=False)
    file_size = Column(BigInteger, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    message = relationship("Message", back_populates="attachments")

# backend/app/models/message.py
class Message(Base):
    # ... existing fields ...
    
    # Legacy single file support (backward compatible)
    file_url = Column(Text, nullable=True)
    file_name = Column(String(255), nullable=True)
    file_type = Column(String(100), nullable=True)
    
    # NEW: Multiple attachments relationship
    attachments = relationship("Attachment", back_populates="message", cascade="all, delete-orphan")
```

**WebSocket Handler (Updated for Multiple Files):**
```python
# backend/app/services/websocket.py

async def handle_websocket_message(data: dict, user: User, db: Session):
    if message_type == "chat_message":
        content = data.get("content", "")
        
        # Legacy single file support
        file_url = data.get("file_url")
        file_name = data.get("file_name")
        file_type = data.get("file_type")
        
        # NEW: Multiple attachments support
        attachments_data = data.get("attachments", [])
        
        # Validate: Must have content OR file OR attachments
        if not content and not file_url and not attachments_data:
            return
        
        # Create message
        new_message = Message(
            content=content,
            sender_id=user.id,
            room_id=room_id,
            receiver_id=receiver_id,
            is_private=is_private,
            file_url=file_url,        # Legacy field
            file_name=file_name,      # Legacy field
            file_type=file_type       # Legacy field
        )
        
        db.add(new_message)
        db.commit()
        db.refresh(new_message)
        
        # Create attachment records for multiple files
        attachment_objects = []
        if attachments_data:
            for att_data in attachments_data:
                attachment = Attachment(
                    message_id=new_message.id,
                    file_url=att_data.get("file_url"),
                    file_name=att_data.get("file_name"),
                    file_type=att_data.get("file_type"),
                    file_size=att_data.get("file_size")
                )
                db.add(attachment)
                attachment_objects.append(attachment)
            
            db.commit()
            for att in attachment_objects:
                db.refresh(att)
        
        # Prepare attachments for response
        attachments_response = [
            {
                "id": att.id,
                "message_id": att.message_id,
                "file_url": att.file_url,
                "file_name": att.file_name,
                "file_type": att.file_type,
                "file_size": att.file_size,
                "created_at": att.created_at.isoformat()
            }
            for att in attachment_objects
        ]
        
        # Broadcast message with attachments
        message_data = {
            "type": "chat_message",
            "id": new_message.id,
            "content": content,
            "file_url": file_url,          # Legacy
            "file_name": file_name,        # Legacy
            "file_type": file_type,        # Legacy
            "attachments": attachments_response,  # NEW
            # ... other fields
        }
```

**Schema Update:**
```python
# backend/app/schemas/attachment.py
class AttachmentBase(BaseModel):
    file_url: str
    file_name: str
    file_type: str
    file_size: Optional[int] = None

class AttachmentResponse(AttachmentBase):
    id: int
    message_id: int
    created_at: datetime
    
    class Config:
        from_attributes = True

# backend/app/schemas/message.py
from typing import List
from .attachment import AttachmentResponse

class MessageBase(BaseModel):
    content: str
    file_url: Optional[str] = None      # Legacy
    file_name: Optional[str] = None     # Legacy
    file_type: Optional[str] = None     # Legacy

class MessageResponse(MessageBase):
    id: int
    sender_id: int
    # ... other fields
    file_url: Optional[str] = None
    file_name: Optional[str] = None
    file_type: Optional[str] = None
    attachments: List[AttachmentResponse] = []  # NEW
    
    class Config:
        from_attributes = True
```

**API Endpoint (Returns attachments):**
```python
# backend/app/api/messages.py

@router.get("/room/{room_id}", response_model=List[MessageWithSender])
async def get_room_messages(room_id: int, db: Session = Depends(get_db)):
    messages = db.query(Message).filter(Message.room_id == room_id).all()
    
    result = []
    for msg in messages:
        # Get attachments for this message
        attachments = db.query(Attachment).filter(Attachment.message_id == msg.id).all()
        attachments_data = [
            {
                "id": att.id,
                "message_id": att.message_id,
                "file_url": att.file_url,
                "file_name": att.file_name,
                "file_type": att.file_type,
                "file_size": att.file_size,
                "created_at": att.created_at.isoformat()
            }
            for att in attachments
        ]
        
        result.append({
            **msg.__dict__,
            "attachments": attachments_data  # Include attachments
        })
    
    return result
```

---

#### 9.6.4 Frontend Implementation

**Upload UI Component (Updated for Multiple Files):**
```jsx
// frontend/src/components/ChatArea.jsx

// State management
const [selectedFile, setSelectedFile] = useState(null)        // Legacy single file
const [filePreview, setFilePreview] = useState(null)          // Legacy preview
const [selectedFiles, setSelectedFiles] = useState([])        // NEW: Multiple files
const [filePreviews, setFilePreviews] = useState([])          // NEW: Multiple previews
const fileInputRef = useRef(null)

// Handle multiple file selection
const handleFileSelect = (e) => {
  const files = Array.from(e.target.files)
  if (files.length === 0) return
  
  // Validate total files (max 5 files)
  if (files.length > 5) {
    alert('You can only upload up to 5 files at once')
    return
  }
  
  // Validate each file size (max 5MB per file)
  const oversizedFiles = files.filter(file => file.size > 5 * 1024 * 1024)
  if (oversizedFiles.length > 0) {
    alert('Each file size must be less than 5MB')
    return
  }
  
  setSelectedFiles(files)
  
  // Create previews for images
  const previews = []
  let loadedCount = 0
  
  files.forEach((file, index) => {
    if (file.type.startsWith('image/')) {
      const reader = new FileReader()
      reader.onloadend = () => {
        previews[index] = { type: 'image', url: reader.result, file }
        loadedCount++
        if (loadedCount === files.length) {
          setFilePreviews([...previews])
        }
      }
      reader.readAsDataURL(file)
    } else {
      previews[index] = { type: 'file', file }
      loadedCount++
      if (loadedCount === files.length) {
        setFilePreviews([...previews])
      }
    }
  })
}

// Remove individual file
const handleRemoveFile = (index = null) => {
  if (index !== null) {
    // Remove specific file from multiple files
    const newFiles = selectedFiles.filter((_, i) => i !== index)
    const newPreviews = filePreviews.filter((_, i) => i !== index)
    setSelectedFiles(newFiles)
    setFilePreviews(newPreviews)
    
    if (newFiles.length === 0 && fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  } else {
    // Remove all files
    setSelectedFile(null)
    setFilePreview(null)
    setSelectedFiles([])
    setFilePreviews([])
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }
}

// Send message with multiple files
const handleSendMessage = (e) => {
  e.preventDefault()
  
  if (!messageInput.trim() && !selectedFile && selectedFiles.length === 0) return
  if (!ws) return
  
  // Handle multiple files
  if (selectedFiles.length > 0) {
    const attachmentsPromises = selectedFiles.map(file => {
      return new Promise((resolve) => {
        const reader = new FileReader()
        reader.onloadend = () => {
          resolve({
            file_url: reader.result,
            file_name: file.name,
            file_type: file.type,
            file_size: file.size
          })
        }
        reader.readAsDataURL(file)
      })
    })
    
    Promise.all(attachmentsPromises).then(attachments => {
      if (currentRoom) {
        ws.sendMessage(messageInput || '', currentRoom.id, null, null, null, null, attachments)
      } else if (currentPrivateChat) {
        ws.sendMessage(messageInput || '', null, currentPrivateChat.id, null, null, null, attachments)
      }
    })
  } else if (selectedFile) {
    // Legacy single file support
    const reader = new FileReader()
    reader.onloadend = () => {
      ws.sendMessage(
        messageInput || '',
        currentRoom?.id,
        currentPrivateChat?.id,
        reader.result,        // Base64 file data
        selectedFile.name,
        selectedFile.type
      )
    }
    reader.readAsDataURL(selectedFile)
  } else {
    ws.sendMessage(messageInput, currentRoom?.id, currentPrivateChat?.id)
  }
  
  // Reset
  setMessageInput('')
  setSelectedFile(null)
  setFilePreview(null)
}
```

**Upload UI JSX:**
```jsx
{/* File preview before sending */}
{selectedFile && (
  <div className="file-preview">
    {filePreview ? (
      <div className="image-preview">
        <img src={filePreview} alt="Preview" />
        <button onClick={handleRemoveFile}>×</button>
      </div>
    ) : (
      <div className="file-info">
        <FaFile />
        <span>{selectedFile.name}</span>
        <span>({(selectedFile.size / 1024).toFixed(1)} KB)</span>
        <button onClick={handleRemoveFile}>×</button>
      </div>
    )}
  </div>
)}

{/* Message input form */}
<form onSubmit={handleSendMessage}>
  <input
    ref={fileInputRef}
    type="file"
    accept="image/*,.pdf,.doc,.docx,.txt"
    onChange={handleFileSelect}
    style={{ display: 'none' }}
  />
  
  <button
    type="button"
    onClick={() => fileInputRef.current?.click()}
    title="Attach file"
  >
    <FaPaperclip />
  </button>
  
  <textarea
    value={messageInput}
    onChange={handleInputChange}
    placeholder="Message..."
  />
  
  <button type="submit" disabled={!messageInput.trim() && !selectedFile}>
    <FaPaperPlane />
  </button>
</form>
```

---

#### 9.6.5 Message Display with Attachments

**Display Logic (Updated for Multiple Attachments):**
```jsx
// Render message with multiple attachments or legacy single file
{msg.attachments && msg.attachments.length > 0 ? (
  // NEW: Message with multiple attachments
  <div className="message-with-attachment">
    {msg.content && (
      <div className="attachment-text">
        {msg.content}
      </div>
    )}
    <div className="message-attachments-grid">
      {msg.attachments.map((att) => (
        <div key={att.id} className="message-attachment">
          {att.file_type?.startsWith('image/') ? (
            <img 
              src={att.file_url} 
              alt={att.file_name} 
              className="message-image"
              onClick={() => window.open(att.file_url, '_blank')}
            />
          ) : (
            <a 
              href={att.file_url} 
              download={att.file_name}
              className="message-file"
            >
              <FaFile className="file-icon" />
              <span>{att.file_name}</span>
            </a>
          )}
        </div>
      ))}
    </div>
  </div>
) : msg.file_url ? (
  // Legacy: Message with single file attachment
  <div className="message-with-attachment">
    {msg.content && (
      <div className="attachment-text">
        {msg.content}
      </div>
    )}
    <div className="message-attachment">
      {msg.file_type?.startsWith('image/') ? (
        <img 
          src={msg.file_url} 
          alt={msg.file_name}
          className="message-image"
          onClick={() => window.open(msg.file_url, '_blank')}
        />
      ) : (
        <a 
          href={msg.file_url} 
          download={msg.file_name}
          className="message-file"
        >
          <FaFile />
          <span>{msg.file_name}</span>
        </a>
      )}
    </div>
  </div>
) : (
  // Text-only message
  <div className="message-text">
    {msg.content}
  </div>
)}
```

**CSS Styling (Updated for Multiple Files):**
```css
/* Multiple Files Preview Container */
.files-preview-container {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 12px;
  padding: 12px;
  background: var(--bg-tertiary);
  border-radius: 8px;
  max-height: 200px;
  overflow-y: auto;
}

.file-preview-item {
  position: relative;
}

.image-preview-small {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}

.image-preview-small img {
  width: 80px;
  height: 80px;
  object-fit: cover;
  border-radius: 8px;
  border: 2px solid var(--border);
}

.file-info-small {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 4px;
  padding: 8px;
  background: var(--bg-secondary);
  border-radius: 8px;
  border: 2px solid var(--border);
  min-width: 80px;
  max-width: 120px;
}

.remove-file-btn-small {
  position: absolute;
  top: -6px;
  right: -6px;
  background: rgba(220, 38, 38, 0.9);
  color: white;
  border: none;
  border-radius: 50%;
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  font-size: 10px;
  transition: background 0.2s;
}

.remove-file-btn-small:hover {
  background: rgba(220, 38, 38, 1);
}

/* Message with attachment wrapper */
.message-with-attachment {
  display: flex;
  flex-direction: column;
  gap: 8px;
  background: var(--bg-secondary);
  padding: 8px 12px;
  border-radius: 12px;
  max-width: 450px;
}

.message.own-message .message-with-attachment {
  background: var(--accent-primary);
  color: white;
}

/* Multiple Attachments Grid in Messages */
.message-attachments-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  gap: 8px;
  margin-top: 8px;
}

.message-attachments-grid .message-attachment {
  margin-top: 0;
}

.message-attachments-grid .message-image {
  width: 100%;
  height: 150px;
  object-fit: cover;
  border-radius: 8px;
}

/* Adjust grid for 1-2 items to be larger */
.message-attachments-grid:has(.message-attachment:nth-child(1):last-child) {
  grid-template-columns: 1fr;
}

.message-attachments-grid:has(.message-attachment:nth-child(1):last-child) .message-image {
  max-width: 400px;
  height: auto;
  max-height: 300px;
}

.message-attachments-grid:has(.message-attachment:nth-child(2):last-child) {
  grid-template-columns: repeat(2, 1fr);
}

/* Image display */
.message-image {
  max-width: 400px;
  max-height: 300px;
  border-radius: 8px;
  cursor: pointer;
  transition: opacity 0.2s;
}

.message-image:hover {
  opacity: 0.9;
}

/* File download link */
.message-file {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  background: var(--bg-modifier-hover);
  border-radius: 8px;
  color: var(--text-normal);
  text-decoration: none;
}

.message-file:hover {
  background: var(--bg-modifier-selected);
}
```

---

#### 9.6.6 Features & Limitations

**✅ Supported Features (v2.0 - Updated):**
- ✅ **Multiple file upload** (up to 5 files at once) - NEW
- ✅ Upload images (JPEG, PNG, GIF)
- ✅ Upload documents (PDF, DOC, DOCX, TXT)
- ✅ **Grid preview** for multiple files before sending - NEW
- ✅ **Individual file removal** from preview - NEW
- ✅ File size validation (max 5MB per file)
- ✅ **Grid layout display** for multiple attachments in messages - NEW
- ✅ Display images inline in chat (clickable to open full size)
- ✅ Download links for non-image files
- ✅ Text + multiple files in same message
- ✅ Works in both public channels and private chats
- ✅ **Backward compatible** with single file uploads
- ✅ **Database optimized** with separate attachments table

**📝 Validation (v2.0 - Updated):**
```javascript
// Frontend validation
- Max files: 5 files per message (NEW)
- Max file size: 5MB per file
- Accepted types: image/*, .pdf, .doc, .docx, .txt
- Alert user if validation fails
- Validate both count and size before upload

// Backend validation
- Message must have content OR file_url OR attachments array
- Attachments stored in separate table with proper indexing
- File data stored as base64 in database
- Foreign key constraints for data integrity
```

**📊 Database Structure (v2.0):**
```
messages table:
  - Legacy fields: file_url, file_name, file_type (backward compatible)
  
attachments table (NEW):
  - id, message_id, file_url, file_name, file_type, file_size, created_at
  - Indexed on message_id for fast queries
  - CASCADE DELETE when message is deleted
```

**⚠️ Current Limitations:**
- Files stored as base64 in database (có thể optimize với cloud storage)
- Không có progress bar khi upload file lớn
- Không có image compression trước khi lưu
- Max 5 files per message

**🔮 Future Enhancements:**
1. Upload to cloud storage (AWS S3, Cloudinary) thay vì base64
2. Image compression và resize tự động
3. ~~Multiple file upload~~ ✅ **DONE (v2.0)**
4. Upload progress indicator
5. File preview modal (gallery view)
6. Video/audio file support
7. Drag & drop upload
8. Copy/paste image from clipboard
9. Increase file count limit (currently 5)
10. Batch download multiple files

---

#### 9.6.7 UI/UX Best Practices

**Upload Experience:**
- ✅ Clear attach button (📎) dễ nhìn
- ✅ Preview image trước khi gửi
- ✅ File size hiển thị rõ ràng (KB)
- ✅ Remove button (×) để xóa file đã chọn
- ✅ Validation errors user-friendly

**Message Display:**
- ✅ Images clickable để xem full size
- ✅ Files có icon phân biệt rõ ràng
- ✅ Text và file trong cùng 1 bubble
- ✅ Layout vertical: Text trên, file dưới
- ✅ Responsive trên mobile

**Alignment ():**
- ✅ Own messages (bên phải): Không avatar
- ✅ Other messages (bên trái): Có avatar
- ✅ Messages liên tiếp: Compact view
- ✅ Messages có attachment: Full view

---

## 📚 PHỤ LỤC

### Database Schema Summary

```sql
users (id, email*, username*, display_name, hashed_password, avatar_url, created_at)
rooms (id, name, description, is_private, created_at)
messages (id, content, sender_id→users, room_id→rooms, receiver_id→users, is_private, 
         file_url, file_name, file_type, created_at)
message_reads (message_id→messages, user_id→users, read_at)
  PRIMARY KEY (message_id, user_id)

* = UNIQUE constraint
→ = FOREIGN KEY
```

### API Endpoints Summary

```
Authentication:
  POST   /api/auth/register
  POST   /api/auth/login
  GET    /api/auth/me

Users:
  GET    /api/users              # Get all users
  GET    /api/users/{id}         # Get user by ID
  PUT    /api/users/me           # Update current user profile (full_name, avatar_url)
  POST   /api/users/me/change-password  # Change current user password

Rooms (Channels):
  GET    /api/rooms              # Get all rooms
  POST   /api/rooms              # Create new room (admin only)
  GET    /api/rooms/{id}         # Get room details
  PUT    /api/rooms/{id}         # Update room (admin only)
  DELETE /api/rooms/{id}         # Delete room (admin only)

Messages:
  POST   /api/messages           # Send message (via WebSocket preferred)
  GET    /api/messages/room/{room_id}        # Get room messages (with read_by)
  GET    /api/messages/private/{user_id}     # Get private messages (with read_by)

WebSocket:
  WS     /api/ws?token={jwt_token}  # WebSocket connection
```

### WebSocket Events Summary

**Client → Server:**
```
connect           - Kết nối WebSocket với JWT token
chat_message      - Gửi tin nhắn (room hoặc private)
join_room         - Join vào room để nhận messages
leave_room        - Rời khỏi room
typing            - Gửi trạng thái typing (is_typing, room_id?, receiver_id?)
mark_as_read      - Đánh dấu messages đã đọc (message_ids: [])
```

**Server → Client:**
```
online_users      - Danh sách user IDs đang online
user_status       - Thay đổi online/offline status (user_id, is_online)
chat_message      - Tin nhắn mới (id, content, sender, room_id?, receiver_id?)
typing            - User đang gõ (user_id, username, is_typing, room_id?, receiver_id?)
message_read      - Tin nhắn đã được đọc (message_id, user_id, username, read_at)
room_deleted      - Room bị xóa (room_id, room_name)
user_joined_room  - User join room (user_id, username, room_id)
user_left_room    - User rời room (user_id, username, room_id)
```

---

**📝 Lưu ý:**
- Tài liệu này mô tả luồng xử lý ở mức logic, không phải implementation chi tiết
- Tham khảo source code để biết implementation cụ thể
- WebSocket events có thể được mở rộng thêm tùy theo tính năng

**🆕 Tính năng mới (v2.2 - 2026-03-11):**
- ✅ **Unread Badge**: Đếm và hiển thị số tin nhắn chưa đọc cho room & private chat
- ✅ **Typing Indicator**: Hiển thị real-time khi user đang gõ tin nhắn
- ✅ **Read Receipts**: Xác nhận đã xem tin nhắn với ✓ (sent) và ✓✓ Seen (màu xanh)
- ✅ **User Profile Settings**: Quản lý hồ sơ cá nhân (đổi tên, avatar, password)
- ✅ **File & Image Upload**: Gửi ảnh và file đính kèm (max 5MB, base64 encoding)
- ✅ **Private Channels**: Channel riêng tư chỉ admin/super admin truy cập
- ✅ **Message Input Enhancement**: Shift+Enter xuống dòng, auto-resize textarea
- ✅ Auto clear badge khi tương tác với chat (click, focus, send)
- ✅ Database migrations: Thêm bảng `message_reads`, columns `file_url/file_name/file_type`, `is_private` cho rooms

**🔗 Tài liệu liên quan:**
- [README.md](README.md) - Hướng dẫn cài đặt và chạy
- [ARCHITECTURE.md](ARCHITECTURE.md) - Kiến trúc hệ thống chi tiết
- [TEST.md](TEST.md) - Hướng dẫn testing

