# Admin & Super Admin Guide

## User Roles

Ứng dụng hỗ trợ 4 loại vai trò người dùng:

1. **User** (Người dùng thông thường)
   - Chat trong các room
   - Gửi tin nhắn private
   - Tạo room mới

2. **Moderator** (Người kiểm duyệt)
   - Tất cả quyền của User
   - (Có thể mở rộng thêm quyền kiểm duyệt nội dung)

3. **Admin** (Quản trị viên)
   - Tất cả quyền của Moderator
   - Xem Admin Panel
   - Xem thống kê hệ thống
   - Deactivate/Activate users
   - Không thể thay đổi role của users

4. **Super Admin** (Quản trị viên cấp cao)
   - Tất cả quyền của Admin
   - Thay đổi role của bất kỳ user nào
   - Delete users vĩnh viễn
   - Không thể bị demote hoặc delete bởi Admin thường

## Tạo Super Admin User

### Cách 1: Sử dụng Script (Khuyến nghị)

```bash
cd first-chat/backend
source venv/bin/activate  # hoặc venv\Scripts\activate trên Windows
python create_superadmin.py
```

Script sẽ hỏi:
- Username
- Email
- Password
- Full Name (optional)

Nếu user đã tồn tại, script sẽ hỏi có muốn promote user đó lên Super Admin không.

### Cách 2: Thông qua Database

```bash
# Đăng nhập PostgreSQL
psql -U chatuser -d chatdb

# Update user thành super admin
UPDATE users SET role = 'super_admin' WHERE username = 'your_username';
```

### Cách 3: Thông qua Python Console

```bash
cd first-chat/backend
source venv/bin/activate
python
```

```python
from app.core import get_db
from app.models import User
from app.models.user import UserRole

db = next(get_db())
user = db.query(User).filter(User.username == "your_username").first()
user.role = UserRole.SUPER_ADMIN
db.commit()
print(f"User {user.username} is now a Super Admin!")
```

## Admin Panel Features

Truy cập Admin Panel tại: `http://localhost:3000/admin`

### Dashboard Statistics

- **Total Users**: Tổng số người dùng
- **Active Users**: Số user đang active
- **Online Now**: Số user đang online
- **Total Rooms**: Tổng số phòng chat
- **Total Messages**: Tổng số tin nhắn

### User Management

**Xem danh sách users:**
- ID, Username, Email
- Role hiện tại
- Status (Active/Inactive)
- Ngày tạo tài khoản
- Avatar

**Actions cho Admin:**
- ✅ Activate user
- ❌ Deactivate user
- 👁️ Xem thông tin chi tiết

**Actions cho Super Admin (thêm):**
- 🔄 Thay đổi role (User → Moderator → Admin)
- 🗑️ Delete user vĩnh viễn

**Bảo vệ:**
- Không thể thay đổi role của chính mình
- Không thể deactivate chính mình
- Không thể delete Super Admin
- Admin thường không thể thay đổi role
- Phải confirm khi delete user

### Role Distribution

Hiển thị số lượng users theo từng role với icon và màu sắc riêng:
- 👑 Super Admin (Vàng)
- 🛡️ Admin (Đỏ)
- 👔 Moderator (Xanh dương)
- 👤 User (Xám)

## API Endpoints cho Admin

### GET /api/admin/stats
Lấy thống kê hệ thống (cần quyền Admin)

**Response:**
```json
{
  "total_users": 10,
  "active_users": 8,
  "online_users": 3,
  "inactive_users": 2,
  "total_rooms": 5,
  "total_messages": 150,
  "users_by_role": {
    "super_admin": 1,
    "admin": 2,
    "moderator": 1,
    "user": 6
  }
}
```

### GET /api/admin/users
Lấy danh sách tất cả users (cần quyền Admin)

### PUT /api/admin/users/{user_id}/role
Thay đổi role của user (chỉ Super Admin)

**Body:**
```json
{
  "role": "admin"
}
```

**Roles:** `user`, `moderator`, `admin`, `super_admin`

### PUT /api/admin/users/{user_id}/deactivate
Deactivate user (cần quyền Admin)

### PUT /api/admin/users/{user_id}/activate
Activate user (cần quyền Admin)

### DELETE /api/admin/users/{user_id}
Delete user vĩnh viễn (chỉ Super Admin)

## Giao diện Admin Panel

### Truy cập
- Click vào icon 🛡️ (shield) ở góc dưới bên trái sidebar
- Hoặc truy cập trực tiếp: `http://localhost:3000/admin`

### Chức năng
1. **Stats Cards**: Hiển thị thống kê tổng quan
2. **User Table**: Quản lý users
   - Sort, filter users
   - Quick actions (activate/deactivate)
   - Role management (Super Admin only)
3. **Role Stats**: Phân bố users theo role

### UI Features
- Discord-style dark theme
- Responsive design
- Real-time updates
- Confirmation dialogs cho actions nguy hiểm
- Visual indicators cho roles và status

## Security Features

### Phân quyền
- Middleware kiểm tra JWT token
- Role-based access control
- Endpoint protection

### Validation
- Không thể tự thay đổi role của mình
- Không thể delete/deactivate Super Admin
- Phải confirm trước khi delete user
- Type username để confirm deletion

### Best Practices

1. **Tạo Super Admin đầu tiên:**
   ```bash
   python create_superadmin.py
   ```

2. **Promote users cẩn thận:**
   - Chỉ promote users tin tưởng lên Admin
   - Giữ số lượng Super Admin ít nhất có thể

3. **Regular audits:**
   - Kiểm tra danh sách users định kỳ
   - Deactivate users không hoạt động
   - Review role assignments

4. **Backup:**
   - Backup database thường xuyên
   - Test restore process

## Troubleshooting

### "Access denied" khi vào Admin Panel
- Kiểm tra user có role là `admin` hoặc `super_admin`
- Logout và login lại để refresh token
- Kiểm tra database: `SELECT username, role FROM users WHERE id = your_id;`

### Không thể thay đổi role
- Chỉ Super Admin mới có quyền này
- Không thể thay đổi role của chính mình
- Không thể demote Super Admin

### Admin Panel không load
- Kiểm tra backend đang chạy
- Kiểm tra console browser để xem errors
- Verify JWT token còn valid

## Future Enhancements

Có thể mở rộng thêm:
- [ ] Activity logs (audit trail)
- [ ] Ban users (temporary suspension)
- [ ] Content moderation tools
- [ ] Bulk actions
- [ ] Advanced analytics
- [ ] Export reports
- [ ] Email notifications
- [ ] Custom permissions per role
- [ ] User warnings system
- [ ] IP banning

## Example: Complete Setup

```bash
# 1. Chạy backend
cd first-chat/backend
source venv/bin/activate
uvicorn app.main:app --reload

# 2. Tạo Super Admin (terminal mới)
cd first-chat/backend
source venv/bin/activate
python create_superadmin.py
# Username: admin
# Email: admin@example.com
# Password: Admin@123

# 3. Chạy frontend (terminal mới)
cd first-chat/frontend
npm run dev

# 4. Login và test
# - Vào http://localhost:3000
# - Login với admin/Admin@123
# - Click icon shield để vào Admin Panel
# - Test các chức năng
```

## Support

Nếu có vấn đề:
1. Check logs trong terminal
2. Check browser console
3. Verify database connection
4. Check API documentation: http://localhost:8000/docs
