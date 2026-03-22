# 🧪 Testing Guide - Discord Chat

Hướng dẫn test các chức năng của ứng dụng.

## Pre-requisites

- Backend đang chạy: http://localhost:8000
- Frontend đang chạy: http://localhost:3000
- Database đã được setup
- Ít nhất 1 Super Admin user đã được tạo

## ✅ Test Checklist

### 1. Authentication Tests

#### ✓ Test User Registration
1. Vào http://localhost:3000/register
2. Điền thông tin:
   - Username: `testuser1`
   - Email: `test1@example.com`
   - Password: `Test@123`
   - Confirm Password: `Test@123`
3. Click "Continue"
4. **Expected:** Tự động login và chuyển đến trang chat

#### ✓ Test User Login
1. Logout (nếu đang login)
2. Vào http://localhost:3000/login
3. Điền:
   - Username: `testuser1`
   - Password: `Test@123`
4. Click "Login"
5. **Expected:** Chuyển đến trang chat

#### ✓ Test Invalid Login
1. Vào http://localhost:3000/login
2. Điền sai password
3. **Expected:** Hiển thị lỗi "Incorrect username or password"

#### ✓ Test Super Admin Login
1. Vào http://localhost:3000/login
2. Login với Super Admin credentials
3. **Expected:** Login thành công, thấy icon 🛡️ và badge 👑

### 2. Room/Channel Tests

#### ✓ Test Create Room
1. Login với user bất kỳ
2. Click nút "+" bên cạnh "TEXT CHANNELS"
3. Nhập:
   - Channel Name: `general`
   - Description: `General discussion`
4. Click "Create Channel"
5. **Expected:** Room được tạo và hiển thị trong sidebar

#### ✓ Test Join Room
1. Login với user khác (user2)
2. Click vào room "general" trong sidebar
3. **Expected:** Vào được room, có thể chat

#### ✓ Test Room Listing
1. Tạo thêm 2-3 rooms
2. **Expected:** Tất cả rooms hiển thị trong sidebar
3. Click vào từng room
4. **Expected:** Mỗi room load đúng messages

### 3. Messaging Tests

#### ✓ Test Send Message in Room
1. Join vào room "general"
2. Gõ message: "Hello, World!"
3. Nhấn Enter
4. **Expected:** Message hiển thị ngay lập tức

#### ✓ Test Receive Message (Real-time)
1. Mở 2 browser windows (hoặc incognito)
2. Login 2 users khác nhau
3. Cả 2 join vào cùng room
4. User 1 gửi message
5. **Expected:** User 2 nhận được message ngay lập tức

#### ✓ Test Private Message
1. Login user1 trong window 1
2. Login user2 trong window 2 (incognito)
3. User1: Click vào "user2" trong member list
4. User1: Gửi message "Hi user2"
5. **Expected:** User2 nhận được message private

#### ✓ Test Message History
1. Gửi 10 messages trong room
2. Refresh trang (F5)
3. **Expected:** Tất cả messages vẫn hiển thị

#### ✓ Test Single File Upload (Legacy)
1. Join vào room
2. Click attach button (📎)
3. Select 1 image file (< 5MB)
4. **Expected:** Preview hiển thị
5. Add message text (optional)
6. Click Send
7. **Expected:** Message với file hiển thị, image clickable

#### ✓ Test Multiple File Upload (v2.0 - NEW)
1. Join vào room
2. Click attach button (📎)
3. Select 2-5 files (Hold Ctrl/Cmd)
4. **Expected:** Grid preview hiển thị tất cả files
5. **Expected:** Images show thumbnails (80x80px)
6. **Expected:** Documents show file icons
7. Add message text: "Check these files!"
8. Click Send
9. **Expected:** Message với grid layout attachments
10. **Expected:** All files clickable/downloadable

#### ✓ Test Remove Individual File
1. Select 3 files
2. Click X button on middle file
3. **Expected:** File removed from preview
4. **Expected:** Other 2 files remain
5. Send message
6. **Expected:** Only 2 files in message

#### ✓ Test File Upload Validation
1. Try select > 5 files
2. **Expected:** Alert "You can only upload up to 5 files at once"
3. Try select file > 5MB
4. **Expected:** Alert "Each file size must be less than 5MB"

#### ✓ Test Multiple Files Display
1. Send message with 2 images
2. **Expected:** Grid layout 2 columns
3. Send message with 4 images
4. **Expected:** Grid layout auto-adjust
5. Click on any image
6. **Expected:** Open in new tab (full size)

#### ✓ Test Mixed File Types
1. Select 2 images + 1 PDF + 1 DOC
2. **Expected:** All preview correctly
3. Send message
4. **Expected:** Images display inline, documents as download links

#### ✓ Test File Upload in Private Chat
1. Start private chat with user2
2. Upload 3 files
3. Send message
4. **Expected:** User2 receives all 3 files
5. **Expected:** Files display correctly

### 4. Online Status Tests

#### ✓ Test Online Status
1. Login user1
2. **Expected:** User1 hiển thị "Online" với green dot trong member list
3. Login user2 trong window khác
4. **Expected:** User1 thấy user2 online

#### ✓ Test Offline Status
1. User1 đang online
2. User2 đang online và thấy user1
3. User1 logout hoặc đóng browser
4. **Expected:** User2 thấy user1 chuyển sang offline (gray dot)

#### ✓ Test Online Users List
1. Login 3 users
2. **Expected:** "ONLINE — 3" hiển thị trong member list
3. 1 user logout
4. **Expected:** "ONLINE — 2"

### 5. Admin Panel Tests

#### ✓ Test Admin Access
1. Login với user thường
2. Try vào http://localhost:3000/admin
3. **Expected:** Redirect về /chat (Access denied)

#### ✓ Test Super Admin Access
1. Login với Super Admin
2. Click icon 🛡️ hoặc vào /admin
3. **Expected:** Vào được Admin Panel

#### ✓ Test Statistics Display
1. Vào Admin Panel với Super Admin
2. **Expected:** Thấy các stats:
   - Total Users
   - Active Users
   - Online Users
   - Total Rooms
   - Total Messages

#### ✓ Test User Management Table
1. Trong Admin Panel
2. **Expected:** Bảng hiển thị:
   - ID, Username, Email
   - Role với màu sắc
   - Status (Active/Inactive)
   - Created date
   - Action buttons

#### ✓ Test Change User Role (Super Admin only)
1. Login Super Admin
2. Vào Admin Panel
3. Chọn 1 user thường
4. Đổi role thành "Moderator"
5. **Expected:** Role được update, badge thay đổi
6. Logout và login lại với user đó
7. **Expected:** User có badge Moderator

#### ✓ Test Deactivate User
1. Login Super Admin
2. Admin Panel > Click ❌ button
3. Confirm
4. **Expected:** User status = Inactive
5. Logout admin, try login với user bị deactivate
6. **Expected:** Login failed hoặc access denied

#### ✓ Test Activate User
1. Click ✅ button trên user inactive
2. **Expected:** User active lại, có thể login

#### ✓ Test Delete User (Super Admin only)
1. Login Super Admin
2. Click 🗑️ button
3. Confirm và type username
4. **Expected:** User bị xóa khỏi database

#### ✓ Test Cannot Self-Modify
1. Login Super Admin
2. Try change own role
3. **Expected:** Dropdown disabled hoặc error
4. Try deactivate self
5. **Expected:** Button disabled hoặc error

### 6. WebSocket Tests

#### ✓ Test WebSocket Connection
1. Login user
2. Mở DevTools (F12) > Network tab
3. Filter "WS" (WebSocket)
4. **Expected:** Thấy connection to ws://localhost:8000/api/ws

#### ✓ Test Reconnection
1. User đang online
2. Stop backend (Ctrl+C)
3. **Expected:** Frontend hiển thị reconnecting
4. Start backend lại
5. **Expected:** Tự động reconnect

#### ✓ Test Message Delivery
1. User1 gửi message trong room
2. Check DevTools > Network > WS
3. **Expected:** Thấy message được send qua WebSocket

### 7. UI/UX Tests

#### ✓ Test Dark Theme
1. Vào ứng dụng
2. **Expected:** Dark theme giống Discord
   - Dark background
   - Light text
   - Proper contrast

#### ✓ Test Responsive Design
1. Resize browser window
2. **Expected:** UI adapt (có thể cần cải thiện cho mobile)

#### ✓ Test Scrolling
1. Gửi 20+ messages trong room
2. **Expected:** Auto scroll to bottom
3. Scroll lên xem old messages
4. **Expected:** Smooth scrolling

#### ✓ Test Avatar Display
1. User có avatar_url (OAuth user)
2. **Expected:** Avatar hiển thị
3. User không có avatar
4. **Expected:** Default icon hiển thị

### 8. Security Tests

#### ✓ Test JWT Token Expiration
1. Login user
2. Đợi 30 phút (hoặc thay đổi ACCESS_TOKEN_EXPIRE_MINUTES = 1)
3. Try gửi message
4. **Expected:** Token expired, logout hoặc refresh token

#### ✓ Test Protected Routes
1. Chưa login
2. Vào http://localhost:3000/chat
3. **Expected:** Redirect to /login
4. Vào http://localhost:3000/admin
5. **Expected:** Redirect to /login

#### ✓ Test SQL Injection (Should be prevented)
1. Register với username: `admin' OR '1'='1`
2. **Expected:** Treated as normal string, not SQL injection

#### ✓ Test XSS (Should be prevented)
1. Send message: `<script>alert('XSS')</script>`
2. **Expected:** Displayed as text, script not executed

### 9. Pin Message Tests (v2.1) 🆕

#### ✓ Test Pin Message in Room
1. Login vào bất kỳ room nào
2. Hover chuột lên một message
3. Click menu (⋮) → Click icon pin (📌)
4. **Expected:** 
   - Message được pin
   - Banner gradient xuất hiện ở đầu chat
   - Icon pin được highlight màu tím

#### ✓ Test Multiple Pinned Messages
1. Pin thêm 2-3 messages khác
2. **Expected:**
   - Banner hiển thị message đầu tiên
   - Xuất hiện dropdown arrow (▼)
   - Click dropdown để xem tất cả pinned messages

#### ✓ Test Pin Limit (Max 5)
1. Pin thêm messages cho đến khi đủ 5
2. Thử pin message thứ 6
3. **Expected:**
   - Alert hiển thị: "Maximum 5 messages can be pinned"
   - Message thứ 6 không được pin

#### ✓ Test Unpin from Banner
1. Có ít nhất 1 pinned message
2. Click nút × bên cạnh message trong banner
3. **Expected:**
   - Message được unpin
   - Banner tự động update
   - Nếu không còn pins, banner biến mất

#### ✓ Test Unpin from Menu
1. Hover lên pinned message (có icon pin màu tím)
2. Click menu (⋮) → Click icon pin lần nữa
3. **Expected:**
   - Message được unpin
   - Icon pin không còn highlight
   - Banner update

#### ✓ Test Scroll to Pinned Message
1. Có pinned message ở giữa conversation
2. Scroll xuống cuối chat
3. Click vào pinned message trong banner
4. **Expected:**
   - Chat tự động scroll đến vị trí message gốc
   - Smooth scroll animation

#### ✓ Test Pin in Private Chat
1. Mở private chat với user khác
2. Pin một message
3. **Expected:**
   - Message được pin
   - Banner hiển thị trong private chat
   - Cả 2 users đều thấy pinned message

#### ✓ Test Real-time Pin Sync
1. Mở 2 browser windows với 2 users khác nhau
2. Cả 2 join cùng 1 room
3. User A pin một message
4. **Expected:**
   - User B thấy message được pin ngay lập tức
   - Banner xuất hiện cho cả 2 users

#### ✓ Test Pin Deleted Message
1. Pin một message
2. Delete message đó (delete for everyone)
3. **Expected:**
   - Message được auto-unpin
   - Banner update hoặc biến mất

#### ✓ Test Pin with Attachments
1. Pin message có file/image attached
2. **Expected:**
   - Banner hiển thị preview message
   - Click vào pin scroll đến message với attachments

#### ✓ Test Mobile Pin Feature
1. Mở app trên mobile device hoặc resize browser
2. Pin messages
3. **Expected:**
   - Banner responsive, hiển thị tốt
   - Touch interactions hoạt động
   - Dropdown menu dễ dàng sử dụng

### 10. Performance Tests

#### ✓ Test Multiple Users
1. Open 5-10 browser windows
2. Login different users
3. All users gửi messages
4. **Expected:** All messages delivered, no lag

#### ✓ Test Large Message Load
1. Gửi 100+ messages trong room
2. Refresh page
3. **Expected:** Load nhanh, hiển thị 50 latest (theo limit)

### 10. Error Handling Tests

#### ✓ Test Backend Down
1. Stop backend
2. Try login
3. **Expected:** Error message hiển thị

#### ✓ Test Database Down
1. Stop PostgreSQL: `sudo systemctl stop postgresql`
2. Restart backend
3. **Expected:** Backend fail to start với error message

#### ✓ Test Invalid Data
1. Register với email không hợp lệ: `notanemail`
2. **Expected:** Validation error
3. Register với password quá ngắn: `123`
4. **Expected:** Validation error (nếu có rule)

## 🎯 Test Scenarios

### Scenario 1: New User Journey
1. Register account
2. Login
3. Create room
4. Send message
5. Chat private với user khác
6. Logout

### Scenario 2: Admin Workflow
1. Login Super Admin
2. View statistics
3. Check user list
4. Promote user to moderator
5. Deactivate problematic user
6. Monitor activity

### Scenario 3: Multi-User Chat
1. 5 users online
2. All join room "general"
3. Conversation with 20+ messages
4. Some users DM each other
5. Some users leave room
6. **Expected:** All functions work smoothly

## 🐛 Bug Reporting

Nếu tìm thấy bug:
1. Note lại steps to reproduce
2. Check browser console errors (F12)
3. Check backend logs
4. Note error messages
5. Create issue hoặc fix it!

## ✅ Test Results Template

```
Test Date: YYYY-MM-DD
Tester: Your Name

Authentication: ✓ PASS / ✗ FAIL
Rooms: ✓ PASS / ✗ FAIL
Messaging: ✓ PASS / ✗ FAIL
File Upload (Single): ✓ PASS / ✗ FAIL
File Upload (Multiple): ✓ PASS / ✗ FAIL (NEW v2.0)
Online Status: ✓ PASS / ✗ FAIL
Admin Panel: ✓ PASS / ✗ FAIL
WebSocket: ✓ PASS / ✗ FAIL
UI/UX: ✓ PASS / ✗ FAIL
Security: ✓ PASS / ✗ FAIL
Performance: ✓ PASS / ✗ FAIL

Notes:
- Bug 1: Description
- Bug 2: Description
```

Happy Testing! 🧪
