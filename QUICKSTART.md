# 🚀 Hướng dẫn Setup từ đầu - Discord Chat

Hướng dẫn chi tiết từng bước để chạy ứng dụng chat realtime.

## ✨ Tính năng mới (v2.2.0)

- ✅ **Trả lời tin nhắn (Reply)**: Click icon reply (↩️) để trích dẫn và trả lời tin nhắn
- ✅ **Nhảy đến tin nhắn gốc**: Click vào quote để scroll đến tin nhắn được trích dẫn
- ✅ **Hiệu ứng highlight**: Tin nhắn gốc sẽ được highlight khi click vào quote
- ✅ **Hỗ trợ đầy đủ**: Hoạt động với text, hình ảnh, và file đính kèm

## 📋 Yêu cầu hệ thống

- **Ubuntu/Debian Linux** (hoặc WSL2 trên Windows)
- Python 3.8 trở lên
- Node.js 16 trở lên
- PostgreSQL 12 trở lên

---

## Bước 1: Cài đặt PostgreSQL

### Trên Ubuntu/Debian:

```bash
# Update package list
sudo apt update

# Cài đặt PostgreSQL
sudo apt install postgresql postgresql-contrib -y

# Khởi động PostgreSQL
sudo systemctl start postgresql
sudo systemctl enable postgresql

# Kiểm tra trạng thái
sudo systemctl status postgresql
```

Bạn sẽ thấy: `Active: active (running)` ✅

---

## Bước 2: Tạo Database và User

```bash
# Đăng nhập vào PostgreSQL với user postgres
sudo -u postgres psql
```

Trong PostgreSQL shell, chạy các lệnh sau:

```sql
-- Tạo database
CREATE DATABASE chatdb;

-- Tạo user
CREATE USER chatuser WITH PASSWORD 'chatpass';

-- Cấp quyền
GRANT ALL PRIVILEGES ON DATABASE chatdb TO chatuser;

-- Thoát
\q
```

### Kiểm tra kết nối database:

```bash
# Test kết nối
psql -U chatuser -d chatdb -h localhost

# Nếu thành công, bạn sẽ thấy prompt:
# chatdb=>

# Gõ \q để thoát
\q
```

✅ Database đã sẵn sàng!

---

## Bước 3: Cài đặt Python và Dependencies

### Kiểm tra Python version:

```bash
python3 --version
# Cần >= Python 3.8
```

Nếu chưa có Python 3.8+:

```bash
sudo apt install python3 python3-pip python3-venv -y
```

---

## Bước 4: Setup Backend

### 4.1. Tạo Virtual Environment

```bash
# Di chuyển vào thư mục backend
cd ~/projects/Minz-chat/backend

# Tạo virtual environment
python3 -m venv venv

# Kích hoạt virtual environment
source venv/bin/activate

# Bạn sẽ thấy (venv) ở đầu dòng lệnh
```

### 4.2. Cài đặt Python packages

```bash
# Đảm bảo vẫn đang ở ~/projects/Minz-chat/backend (không cần cd)
# Bạn sẽ thấy (venv) ở đầu dòng lệnh

# Cài đặt tất cả dependencies
pip install --upgrade pip
pip install -r requirements.txt
```

Quá trình này sẽ mất vài phút. Bạn sẽ thấy các packages được cài:
- fastapi
- uvicorn
- sqlalchemy
- psycopg2-binary
- python-jose
- ... và nhiều packages khác

### 4.3. Tạo file .env

```bash
# Vẫn ở ~/projects/Minz-chat/backend (không cần cd)

# Copy file .env.example
cp .env.example .env

# Tạo SECRET_KEY mới
python3 -c "import secrets; print(secrets.token_hex(32))"
```

Copy SECRET_KEY vừa tạo và mở file .env:

```bash
nano .env
```

Chỉnh sửa file như sau:

```env
# Database
DATABASE_URL=postgresql://chatuser:chatpass@localhost:5432/chatdb

# JWT - Paste SECRET_KEY bạn vừa tạo ở đây
SECRET_KEY=your_generated_secret_key_here
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30

# OAuth2 - Google (Tạm thời để trống, setup sau nếu muốn)
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=

# OAuth2 - GitHub (Tạm thời để trống, setup sau nếu muốn)
GITHUB_CLIENT_ID=
GITHUB_CLIENT_SECRET=

# App
APP_NAME=Discord-like Chat
BACKEND_URL=http://localhost:8000
FRONTEND_URL=http://localhost:3000
```

Lưu file:
- Nhấn `Ctrl + O` (save)
- Nhấn `Enter`
- Nhấn `Ctrl + X` (exit)

### 4.4. Khởi tạo Database (QUAN TRỌNG!)

**Cho cài đặt mới (Fresh Installation):**

```bash
# Vẫn ở ~/projects/Minz-chat/backend (không cần cd)
# Đảm bảo đang trong virtual environment (có (venv) ở đầu dòng)

# Khởi tạo database - tạo tất cả các bảng
python3 init_db.py
```

Bạn sẽ thấy:
```
Initializing database...
Creating all tables from models...
✓ Database initialized successfully!
✓ Tables created:
  - users
  - rooms
  - room_members
  - messages
  - message_reads
  - attachments
```

✅ Database đã có đầy đủ tables!

**⚠️ Cho người dùng đang upgrade (Existing Installation):**

Nếu bạn đã có database từ phiên bản cũ và đang nâng cấp, hãy chạy các migration scripts:

```bash
# Migration 1: Thêm bảng attachments (v2.0)
python3 apply_migration.py

# Migration 2: Thêm cột reply_to_message_id (v2.2)
python3 add_reply_column.py

# Migration 3: Thêm bảng message_reactions (v2.3)
python3 add_reactions_table.py

# Migration 4: Thêm tính năng pin messages (v2.1) ⭐ MỚI
python3 add_pin_migration.py
```

Kết quả mong đợi:
```
# apply_migration.py:
Applying migration: Create attachments table...
✓ Migration applied successfully!
✓ Attachments table created

# add_reply_column.py:
✓ Column reply_to_message_id added successfully!
# hoặc nếu đã có:
ℹ️  Column reply_to_message_id already exists

# add_reactions_table.py:
Creating message_reactions table...
✓ Table message_reactions created successfully!
✓ Index created on message_id
✓ Unique constraint added for (message_id, user_id, emoji)
# hoặc nếu đã có:
ℹ️  Table message_reactions already exists

# add_pin_migration.py: ⭐ MỚI
🔧 Starting migration: Add pin columns to messages table
📝 Adding pin columns to messages table...
✅ Added is_pinned column
✅ Added pinned_at column
✅ Added pinned_by_user_id column
✅ Created index on is_pinned column
✅ Migration completed successfully!
🎉 Pin message feature is now ready to use!
```

**💡 Lưu ý:** 
- Luôn backup database trước khi chạy migration!
- Các migration có thể chạy nhiều lần an toàn (idempotent)
- Pin message migration thêm 3 cột: `is_pinned`, `pinned_at`, `pinned_by_user_id`

### 4.5. Khởi động Backend

```bash
# Vẫn ở ~/projects/Minz-chat/backend (không cần cd)
# Đảm bảo đang trong virtual environment (có (venv) ở đầu dòng)
# Nếu chưa có, chạy: source venv/bin/activate

# Khởi động server
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

Bạn sẽ thấy:

```
INFO:     Uvicorn running on http://0.0.0.0:8000 (Press CTRL+C to quit)
INFO:     Started reloader process
INFO:     Started server process
INFO:     Waiting for application startup.
INFO:     Application startup complete.
```

✅ Backend đang chạy!

### 4.6. Kiểm tra Backend

Mở trình duyệt và vào: http://localhost:8000

Bạn sẽ thấy:
```json
{
  "message": "Discord-like Chat API",
  "version": "1.0.0",
  "docs": "/docs"
}
```

API Documentation: http://localhost:8000/docs

🎉 Backend hoạt động!

**⚠️ Giữ terminal này mở, backend cần chạy liên tục!**

---

## Bước 5: Setup Frontend

### Mở terminal MỚI (Terminal 2)

### 5.1. Cài đặt Node.js (nếu chưa có)

Kiểm tra version:

```bash
node --version
npm --version
```

Nếu chưa có hoặc version < 16:

```bash
# Cài đặt NVM (Node Version Manager)
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash

# Load NVM
source ~/.bashrc

# Cài đặt Node.js LTS
nvm install --lts
nvm use --lts

# Kiểm tra lại
node --version  # Sẽ là v18.x hoặc v20.x
```

### 5.2. Cài đặt Frontend Dependencies

```bash
# Di chuyển vào thư mục frontend
cd ~/projects/Minz-chat/frontend

# Cài đặt packages
npm install
```

Quá trình này sẽ mất vài phút. Bạn sẽ thấy:
```
added 300+ packages in 2m
```

### 5.3. Khởi động Frontend

```bash
# Khởi động development server
npm run dev
```

Bạn sẽ thấy:

```
  VITE v5.0.8  ready in 500 ms

  ➜  Local:   http://localhost:3000/
  ➜  Network: use --host to expose
  ➜  press h + enter to show help
```

✅ Frontend đang chạy!

**⚠️ Giữ terminal này mở!**

---

## Bước 6: Tạo Super Admin User

### Mở terminal MỚI (Terminal 3)

```bash
# Di chuyển vào backend
cd ~/projects/Minz-chat/backend

# Kích hoạt virtual environment
source venv/bin/activate

# Chạy script tạo super admin
python create_superadmin.py
```

Nhập thông tin:

```
=== Create Super Admin User ===

Username: minhmh
Email: maihongminh08@gmail.com
Password: Minh@123
Confirm Password: Minh@123
Full Name (optional): System Administrator
```

Bạn sẽ thấy:

```
✓ Super admin user created successfully!
  Username: admin
  Email: admin@example.com
  Role: super_admin

You can now login with these credentials.
```

🎉 Super Admin đã được tạo!

---

## Bước 7: Sử dụng Ứng dụng

### 7.1. Mở trình duyệt

Vào: http://localhost:3000

### 7.2. Đăng ký User thường

1. Click **"Register"**
2. Điền thông tin:
   - Username: `user1`
   - Email: `user1@example.com`
   - Password: `password123`
   - Confirm Password: `password123`
3. Click **"Continue"**

✅ Bạn sẽ tự động được đăng nhập!

### 7.3. Tạo Room Chat

1. Trong giao diện chat, click nút **"+"** bên cạnh "TEXT CHANNELS"
2. Nhập:
   - Channel Name: `general`
   - Description: `General discussion`
3. Click **"Create Channel"**

✅ Room đã được tạo!

### 7.4. Gửi tin nhắn

1. Chọn room `#general`
2. Gõ tin nhắn vào ô input ở dưới cùng
3. Nhấn **Enter** để gửi

🎉 Tin nhắn đã được gửi!

### 7.5. Test Private Chat (2 users)

1. Mở **Incognito/Private window** (Ctrl + Shift + N)
2. Vào: http://localhost:3000
3. Đăng ký user thứ 2:
   - Username: `user2`
   - Email: `user2@example.com`
   - Password: `password123`
4. Trong cửa sổ đầu tiên, click vào `user2` trong danh sách bên phải
5. Gửi tin nhắn private!

✅ Chat private hoạt động!

### 7.6. Test Admin Panel

1. Logout khỏi user1
2. Login với Super Admin:
   - Username: `admin`
   - Password: `Admin@123`
3. Click icon **🛡️** (shield) ở góc dưới sidebar
4. Hoặc vào: http://localhost:3000/admin

Bạn sẽ thấy:
- **Dashboard**: Statistics về users, rooms, messages
- **User Management**: Danh sách users với actions
- **Role Distribution**: Phân bố users theo role

### 7.7. Quản lý Users (Super Admin)

**Thay đổi Role:**
1. Trong bảng User Management
2. Tìm `user1`
3. Click dropdown "Role"
4. Chọn `Moderator` hoặc `Admin`
5. Confirm

**Deactivate User:**
1. Click nút ❌ (ban icon)
2. Confirm
3. User sẽ không thể login

**Delete User:**
1. Click nút 🗑️ (trash icon)
2. Confirm
3. Nhập lại username để xác nhận
4. User bị xóa vĩnh viễn

---

## Bước 8: Kiểm tra tất cả hoạt động

### Checklist ✅

- [ ] Backend running on http://localhost:8000
- [ ] Frontend running on http://localhost:3000
- [ ] Database connected
- [ ] User registration works
- [ ] Login works
- [ ] Create room works
- [ ] Send message works
- [ ] Private chat works
- [ ] Online status shows
- [ ] Super admin login works
- [ ] Admin panel accessible
- [ ] User management works

---

## 🔧 Troubleshooting

### Lỗi: "Connection refused" khi start backend

**Nguyên nhân:** PostgreSQL chưa chạy

**Giải pháp:**
```bash
sudo systemctl start postgresql
sudo systemctl status postgresql
```

### Lỗi: "Module not found" khi start backend

**Nguyên nhân:** Virtual environment chưa activate hoặc packages chưa cài

**Giải pháp:**
```bash
cd ~/projects/Minz-chat/backend
source venv/bin/activate
pip install -r requirements.txt
```

### Lỗi: "Database does not exist"

**Nguyên nhân:** Database chưa được tạo

**Giải pháp:**
```bash
sudo -u postgres psql
CREATE DATABASE chatdb;
\q
```

### Lỗi: Frontend không connect được backend

**Nguyên nhân:** Backend không chạy hoặc CORS issue

**Giải pháp:**
1. Kiểm tra backend đang chạy: http://localhost:8000
2. Check console browser (F12) để xem error
3. Restart cả backend và frontend

### WebSocket không hoạt động

**Nguyên nhân:** JWT token expired hoặc backend issue

**Giải pháp:**
1. Logout và login lại
2. Check backend terminal logs
3. Restart backend

### Admin Panel shows "Access Denied"

**Nguyên nhân:** User không phải admin

**Giải pháp:**
```bash
# Promote user to admin
cd ~/projects/Minz-chat/backend
source venv/bin/activate
python create_superadmin.py
# Chọn promote existing user
```

---

## 🚀 Lệnh tắt để chạy lại sau này

### Terminal 1 - Backend:
```bash
cd ~/projects/Minz-chat/backend
source venv/bin/activate
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### Terminal 2 - Frontend:
```bash
cd ~/projects/Minz-chat/frontend
npm run dev
```

### Stop ứng dụng:
- Nhấn `Ctrl + C` trong mỗi terminal

---

## 📚 Tài liệu thêm

- **README.md** - Tổng quan về project
- **ADMIN_GUIDE.md** - Hướng dẫn chi tiết Admin Panel
- **SETUP.md** - Hướng dẫn setup nâng cao
- **API Docs** - http://localhost:8000/docs

---

## 🎯 Các bước tiếp theo

1. ✅ Setup OAuth2 (Google/GitHub) - Optional
2. ✅ Deploy lên production server
3. ✅ Thêm features mới
4. ✅ Customize UI theo ý thích

## 🆕 Tính năng đã có

- ✅ **Multiple file upload** - Upload tối đa 5 files mỗi tin nhắn
- ✅ **Clipboard paste** - Paste hình ảnh trực tiếp (Ctrl+V / Cmd+V)
- ✅ **Edit messages** - Sửa tin nhắn đã gửi
- ✅ **Delete messages** - Xóa cho mình hoặc cho mọi người
- ✅ **Reply to messages** - Trích dẫn và trả lời tin nhắn (v2.2.0)
- ✅ **Message reactions** - Thả emoji phản ứng vào tin nhắn (v2.3.0)
  - 6 emoji: 👍 ❤️ 😂 😮 😢 🙏
  - Click để thêm/xóa, realtime updates
- ✅ **Message actions menu** - Menu 3 chấm với Reaction/Edit/Delete/Reply
- ✅ **Read receipts** - Hiển thị trạng thái đã đọc
- ✅ **Typing indicators** - Hiển thị ai đang gõ

---

## 💡 Tips

**Để backend chạy background (Linux):**
```bash
# Sử dụng screen hoặc tmux
sudo apt install screen
screen -S backend
cd ~/projects/Minz-chat/backend
source venv/bin/activate
uvicorn app.main:app --host 0.0.0.0 --port 8000
# Nhấn Ctrl+A, sau đó D để detach
# Để attach lại: screen -r backend
```

**Check logs:**
```bash
# Backend logs: Xem trong terminal đang chạy backend
# Frontend logs: Xem trong terminal đang chạy frontend
# Database logs:
sudo tail -f /var/log/postgresql/postgresql-*.log
```

**Backup database:**
```bash
pg_dump -U chatuser chatdb > backup.sql
# Restore: psql -U chatuser chatdb < backup.sql
```

---

## ✨ Hoàn thành!

Chúc mừng! Bạn đã setup thành công ứng dụng Discord Chat! 🎉

Nếu cần hỗ trợ, check:
- Backend logs trong terminal
- Frontend console (F12 trong browser)
- Database connection
- File .env configuration

Happy Chatting! 💬
