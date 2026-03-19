# 🎮 Discord Chat - Ứng dụng Chat Realtime

Ứng dụng chat realtime với giao diện giống Discord, được xây dựng bằng **FastAPI** (Python) và **React**.

## ⚡ Quick Start (Cài đặt nhanh)

### Cách 1: Automatic Install (Khuyến nghị) 🚀

```bash
cd first-chat
./INSTALL.sh
```

Script này sẽ tự động:
- ✅ Cài đặt tất cả dependencies
- ✅ Setup PostgreSQL database
- ✅ Tạo virtual environment
- ✅ Generate SECRET_KEY
- ✅ Cài đặt packages
- ✅ Tạo Super Admin user

### Cách 2: Manual Setup 📋

Xem chi tiết trong file **QUICKSTART.md**

## 🎯 Sử dụng

### Khởi động ứng dụng:

```bash
./START.sh
```

### Dừng ứng dụng:

```bash
./STOP.sh
```

### Kiểm tra trạng thái:

```bash
./CHECK.sh
```

### Truy cập:

- **Frontend:** http://localhost:3000
- **Backend API:** http://localhost:8000
- **API Docs:** http://localhost:8000/docs
- **Admin Panel:** http://localhost:3000/admin

## ✨ Tính năng chính

### 👥 User Management
- ✅ Đăng ký / Đăng nhập
- ✅ JWT Authentication
- ✅ OAuth2 (Google, GitHub)
- ✅ User profiles & avatars
- ✅ 4 loại vai trò: User, Moderator, Admin, Super Admin

### 💬 Chat Features
- ✅ **Chat Realtime** qua WebSocket
- ✅ **Private Messages** (1-1)
- ✅ **Chat Rooms** (Public channels)
- ✅ **Online/Offline status** realtime
- ✅ Message history với pagination
- ✅ Typing indicators
- ✅ Read receipts
- ✅ Timestamps
- ✅ **Upload nhiều files** (tối đa 5 files/message) 🆕
- ✅ Preview hình ảnh và tài liệu
- ✅ Hiển thị attachments dạng grid
- ✅ **Chỉnh sửa tin nhắn** - Edit tin nhắn đã gửi với inline editing 🆕
- ✅ **Xóa tin nhắn** - Xóa cho mình hoặc xóa cho mọi người 🆕
- ✅ **Menu hành động** - Nút 3 chấm khi hover với tùy chọn Edit/Delete 🆕

### 🛡️ Admin Panel
- ✅ Dashboard với statistics
- ✅ Quản lý users
- ✅ Thay đổi roles
- ✅ Activate/Deactivate users
- ✅ Delete users
- ✅ View system stats

### 🎨 UI/UX
- ✅ Discord-inspired dark theme
- ✅ Responsive design
- ✅ Clean và modern
- ✅ Real-time updates

## 📁 Cấu trúc Project

```
first-chat/
├── backend/              # FastAPI Backend
│   ├── app/
│   │   ├── api/         # API endpoints
│   │   ├── core/        # Config, security, database
│   │   ├── models/      # SQLAlchemy models
│   │   ├── schemas/     # Pydantic schemas
│   │   └── services/    # Business logic
│   ├── requirements.txt
│   ├── .env.example
│   └── create_superadmin.py
│
├── frontend/            # React Frontend
│   ├── src/
│   │   ├── components/  # React components
│   │   ├── pages/       # Pages
│   │   ├── services/    # API & WebSocket
│   │   ├── styles/      # CSS files
│   │   └── utils/       # Utilities
│   ├── package.json
│   └── vite.config.js
│
├── INSTALL.sh          # Script cài đặt tự động
├── START.sh            # Script khởi động
├── STOP.sh             # Script dừng app
├── CHECK.sh            # Script kiểm tra
├── QUICKSTART.md       # Hướng dẫn chi tiết
├── ADMIN_GUIDE.md      # Hướng dẫn Admin
└── README.md           # File này
```

## 🔧 Tech Stack

### Backend
- **FastAPI** - Modern Python web framework
- **PostgreSQL** - Relational database
- **SQLAlchemy** - ORM
- **WebSockets** - Real-time communication
- **JWT** - Authentication
- **OAuth2** - Social login
- **Uvicorn** - ASGI server

### Frontend
- **React 18** - UI library
- **Vite** - Build tool & dev server
- **Zustand** - State management
- **Axios** - HTTP client
- **React Router** - Navigation
- **React Icons** - Icon library

## 👤 User Roles

1. **User** - Người dùng thông thường
   - Chat trong rooms
   - Gửi tin nhắn private
   - Tạo rooms

2. **Moderator** - Người kiểm duyệt
   - Tất cả quyền User
   - (Có thể mở rộng)

3. **Admin** - Quản trị viên
   - Quản lý users
   - Xem statistics
   - Activate/Deactivate users

4. **Super Admin** - Quản trị viên cấp cao
   - Tất cả quyền Admin
   - Thay đổi roles
   - Delete users

## 🚀 Các Scripts Tiện Ích

### ./INSTALL.sh
Cài đặt toàn bộ ứng dụng tự động:
```bash
./INSTALL.sh
```

### ./START.sh
Khởi động cả backend và frontend:
```bash
./START.sh
```

### ./STOP.sh
Dừng ứng dụng:
```bash
./STOP.sh
```

### ./CHECK.sh
Kiểm tra:
- System requirements
- Database connection
- Project structure
- Running processes
```bash
./CHECK.sh
```

## 📚 Documentation

- **README.md** (file này) - Tổng quan
- **README_VI.md** - Phiên bản tiếng Việt
- **QUICKSTART.md** - Hướng dẫn setup chi tiết từng bước
- **ADMIN_GUIDE.md** - Hướng dẫn sử dụng Admin Panel
- **SETUP.md** - Setup nâng cao

## 🎓 Hướng dẫn sử dụng

### 1. Đăng ký tài khoản

1. Vào http://localhost:3000
2. Click "Register"
3. Điền username, email, password
4. Click "Continue"

### 2. Tạo Room Chat

1. Click nút "+" bên cạnh "TEXT CHANNELS"
2. Nhập tên room và mô tả
3. Click "Create Channel"

### 3. Chat trong Room

1. Click vào room trong sidebar
2. Gõ tin nhắn ở ô input phía dưới
3. Nhấn Enter để gửi

### 4. Chat Private

1. Click vào username trong danh sách bên phải
2. Gửi tin nhắn trực tiếp

### 5. Admin Panel (Admin/Super Admin)

1. Login với tài khoản admin
2. Click icon 🛡️ ở góc dưới sidebar
3. Hoặc vào: http://localhost:3000/admin

## 🔐 Tạo Super Admin

### Cách 1: Sử dụng script

```bash
cd backend
source venv/bin/activate
python create_superadmin.py
```

### Cách 2: Qua database

```bash
sudo -u postgres psql chatdb
UPDATE users SET role = 'super_admin' WHERE username = 'your_username';
\q
```

## 🐛 Troubleshooting

### Backend không start được

```bash
# Kiểm tra PostgreSQL
sudo systemctl status postgresql

# Kiểm tra virtual environment
cd backend
source venv/bin/activate
pip install -r requirements.txt
```

### Frontend không connect backend

```bash
# Kiểm tra backend đang chạy
curl http://localhost:8000

# Xem logs
tail -f backend/backend.log
```

### Database connection failed

```bash
# Test connection
psql -U chatuser -d chatdb -h localhost

# Nếu lỗi, tạo lại database
sudo -u postgres psql
CREATE DATABASE chatdb;
GRANT ALL PRIVILEGES ON DATABASE chatdb TO chatuser;
\q
```

### WebSocket không hoạt động

- Logout và login lại
- Kiểm tra backend logs
- Clear browser cache

## 🎯 Development

### Chạy Backend (Manual)

```bash
cd backend
source venv/bin/activate
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### Chạy Frontend (Manual)

```bash
cd frontend
npm run dev
```

### Build Frontend cho Production

```bash
cd frontend
npm run build
```

## 🚢 Deployment

### Backend Options
- Heroku
- DigitalOcean App Platform
- AWS Elastic Beanstalk
- Railway
- Render

### Frontend Options
- Vercel
- Netlify
- Cloudflare Pages
- GitHub Pages

### Database
- AWS RDS PostgreSQL
- DigitalOcean Managed Database
- Heroku Postgres
- Supabase

## 🎉 Cập nhật gần đây

### v2.0 - Tính năng Upload Nhiều Files
- ✅ Upload tối đa 5 files cùng lúc
- ✅ Preview dạng grid trước khi gửi
- ✅ Xóa từng file riêng lẻ
- ✅ Hiển thị attachments theo grid layout
- ✅ Hỗ trợ hình ảnh (JPEG, PNG, GIF) và tài liệu (PDF, DOC, DOCX, TXT)
- ✅ Validation kích thước file (max 5MB/file)
- ✅ Database được tối ưu với bảng attachments riêng
- ✅ Tương thích ngược với single file uploads

## 🔮 Tính năng có thể mở rộng

- [x] ~~Upload files/images~~ ✅ **ĐÃ HOÀN THÀNH (v2.0)**
- [ ] Emoji picker & reactions
- [ ] Voice/Video calls
- [ ] Message editing & deletion
- [ ] Search messages
- [ ] Notifications
- [ ] User roles & permissions (Đã có phần - Admin roles)
- [ ] Content moderation
- [ ] Activity logs
- [ ] Markdown support
- [ ] Dark/Light theme toggle
- [ ] Mobile app (React Native)
- [ ] Cloud storage integration (S3/Cloudinary)
- [ ] Image compression
- [ ] Drag & drop file upload

## 📊 API Endpoints

### Authentication
- `POST /api/auth/register` - Đăng ký
- `POST /api/auth/login` - Đăng nhập
- `GET /api/auth/me` - Thông tin user hiện tại
- `GET /api/auth/google` - Google OAuth
- `GET /api/auth/github` - GitHub OAuth

### Users
- `GET /api/users/` - Danh sách users
- `GET /api/users/online` - Users online
- `GET /api/users/{id}` - Chi tiết user
- `PUT /api/users/me` - Update profile

### Rooms
- `GET /api/rooms/` - Danh sách rooms
- `POST /api/rooms/` - Tạo room
- `POST /api/rooms/{id}/join` - Join room
- `POST /api/rooms/{id}/leave` - Leave room
- `GET /api/rooms/{id}/members` - Members

### Messages
- `POST /api/messages/` - Gửi message
- `GET /api/messages/room/{id}` - Messages trong room
- `GET /api/messages/private/{id}` - Private messages

### Admin (Admin/Super Admin only)
- `GET /api/admin/stats` - Statistics
- `GET /api/admin/users` - Tất cả users
- `PUT /api/admin/users/{id}/role` - Đổi role
- `PUT /api/admin/users/{id}/activate` - Activate
- `PUT /api/admin/users/{id}/deactivate` - Deactivate
- `DELETE /api/admin/users/{id}` - Delete user

### WebSocket
- `WS /api/ws?token={jwt_token}` - WebSocket connection

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

MIT License - Free to use for personal and commercial projects.

## 💬 Support

Nếu gặp vấn đề:
1. Kiểm tra logs (backend.log, frontend.log)
2. Chạy `./CHECK.sh` để kiểm tra
3. Xem QUICKSTART.md và ADMIN_GUIDE.md
4. Kiểm tra API docs: http://localhost:8000/docs

## 🎉 Hoàn thành!

Chúc bạn có trải nghiệm tốt với Discord Chat! 

Happy Chatting! 💬
