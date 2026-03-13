# Changelog - First Chat Application

## [v2.0.0] - 2024-03-13

### 🎉 Major Features

#### Multiple File Upload
- ✅ Upload up to 5 files simultaneously per message
- ✅ Grid preview interface before sending
- ✅ Individual file removal from preview
- ✅ Grid layout display for multiple attachments in messages
- ✅ Support for images (JPEG, PNG, GIF) and documents (PDF, DOC, DOCX, TXT)
- ✅ File size validation (max 5MB per file)
- ✅ Database optimized with separate `attachments` table
- ✅ Backward compatible with existing single file uploads

### 🗄️ Database Changes

#### New Table: `attachments`
```sql
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
```

#### Updated Table: `messages`
- Retained legacy fields for backward compatibility:
  - `file_url`, `file_name`, `file_type` (nullable)

### 📦 Backend Changes

#### New Files
- `backend/app/models/attachment.py` - Attachment model
- `backend/app/schemas/attachment.py` - Attachment schemas
- `backend/apply_migration.py` - Migration script
- `backend/create_attachments_table.sql` - SQL migration

#### Modified Files
- `backend/app/models/message.py` - Added attachments relationship
- `backend/app/models/__init__.py` - Export Attachment model
- `backend/app/schemas/message.py` - Added attachments field
- `backend/app/schemas/__init__.py` - Export attachment schemas
- `backend/app/api/messages.py` - Return attachments in API responses
- `backend/app/services/websocket.py` - Handle multiple file uploads

### 🎨 Frontend Changes

#### Modified Files
- `frontend/src/components/ChatArea.jsx`:
  - Multiple file selection support
  - Grid preview UI
  - Individual file removal
  - Display multiple attachments in grid layout
- `frontend/src/services/websocket.js` - Send attachments array
- `frontend/src/styles/chatarea.css` - Styling for multiple files UI

### 🔧 Technical Details

#### WebSocket Message Format
```javascript
{
  type: 'chat_message',
  content: 'Message text',
  attachments: [
    {
      file_url: 'base64_data',
      file_name: 'image.jpg',
      file_type: 'image/jpeg',
      file_size: 12345
    }
  ]
}
```

#### API Response Format
```javascript
{
  id: 1,
  content: 'Message',
  attachments: [
    {
      id: 1,
      message_id: 1,
      file_url: 'base64_data',
      file_name: 'image.jpg',
      file_type: 'image/jpeg',
      file_size: 12345,
      created_at: '2024-03-13T00:00:00'
    }
  ]
}
```

### 📝 Documentation Updates

- Updated `flow.md` - Added detailed Multiple File Upload flow
- Updated `README.md` - Added v2.0 features
- Updated `ARCHITECTURE.md` - Added Attachment model and database schema
- Created `CHANGELOG.md` - This file

### 🔄 Migration Guide

To upgrade to v2.0:

```bash
# 1. Pull latest code
git pull

# 2. Run database migration
cd backend
python3 apply_migration.py

# Or manually:
psql -U chatuser -d chatdb -f create_attachments_table.sql

# 3. Restart backend
# The backend will automatically work with new schema

# 4. Clear browser cache
# Frontend will automatically use new features
```

### ⚠️ Breaking Changes

None - Fully backward compatible!

### 🐛 Bug Fixes

- Improved file validation on frontend
- Better error handling for oversized files

### 🔮 Future Enhancements

- Cloud storage integration (S3/Cloudinary)
- Image compression before upload
- Drag & drop file upload
- Upload progress indicator
- Video file support
- Batch download multiple files

---

## [v1.0.0] - Initial Release

### Features
- User authentication (JWT + OAuth2)
- Real-time chat via WebSocket
- Public rooms and private messages
- User online status
- Typing indicators
- Read receipts
- Single file upload
- Admin panel
- Role-based permissions

---

**Note**: Version numbers follow Semantic Versioning (SemVer)
