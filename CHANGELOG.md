# Changelog - Minz Chat Application

## [v2.1.0] - 2026-03-19

### 🎉 Major Features

#### Message Edit & Delete
- ✅ **Edit Messages**: Edit your sent messages with inline editing
  - Click 3-dot menu (⋮) → Edit
  - Inline textarea with Save/Cancel buttons
  - Shows "(edited)" indicator after editing
  - Real-time sync across all users
  - Keyboard shortcuts: Enter to save, Esc to cancel

- ✅ **Delete Messages**: Two deletion modes
  - **Delete for me**: Only hides message on your device
  - **Delete for everyone**: Replaces message with "This message was deleted" for all users
  - Confirmation popup with clear options
  - Real-time sync via WebSocket

#### Message Actions UI
- ✅ **3-dot Menu**: Hover on any message to see action menu
  - Appears on all messages (with/without attachments)
  - Clean horizontal icon popup (Edit + Delete)
  - Perfectly aligned, doesn't affect message layout
  - Auto-scroll when editing last message to prevent overlap with input area

### 🗄️ Database Changes

#### Updated Table: `messages`
- Added `is_edited` column (Boolean, default: False)
- Added `is_deleted` column (Boolean, default: False)
- Both fields already existed in schema, now utilized

### 📦 Backend Changes

#### New API Endpoints
- **PUT** `/api/messages/{message_id}` - Edit message content
  - Updates message content
  - Sets `is_edited = True`
  - Returns updated message
  
- **DELETE** `/api/messages/{message_id}` - Delete message
  - Query param: `delete_for_everyone` (boolean)
  - For everyone: Sets `is_deleted = True` and content to "This message was deleted"
  - For me: Returns success, frontend handles hiding

#### WebSocket Handlers
- **edit_message**: Real-time message editing
  - Validates sender ownership
  - Broadcasts to all relevant users
  - Updates message in database
  
- **delete_message**: Real-time message deletion
  - Validates sender ownership
  - Two modes: delete for everyone / delete for me
  - Broadcasts to appropriate recipients

#### Modified Files
- `backend/app/api/messages.py` - Added edit/delete endpoints
- `backend/app/services/websocket.py` - Added WebSocket handlers
- `backend/app/models/message.py` - Utilized is_edited and is_deleted fields

### 🎨 Frontend Changes

#### New WebSocket Methods
- `editMessage(messageId, newContent)` - Send edit request
- `deleteMessage(messageId, deleteForEveryone)` - Send delete request

#### Store Updates
- `updateMessage(messageId, updates)` - Update message in state
- `hideMessage(messageId)` - Hide message locally (delete for me)
- `deleteMessageLocally(messageId)` - Remove from messages array

#### Chat.jsx Enhancements
- Handle `message_edited` event - Update message content and show edited indicator
- Handle `message_deleted` event - Update or hide message based on deletion type

#### ChatArea.jsx Major Refactor
- **Message Actions UI**:
  - 3-dot menu button on hover
  - Horizontal icon popup with Edit/Delete
  - Position: absolute, doesn't affect layout
  - Clean alignment for all message types
  
- **Edit Mode**:
  - Inline textarea replacement
  - Save/Cancel action buttons
  - Auto-scroll for last message
  - Keyboard shortcuts support
  
- **Delete Confirmation**:
  - Beautiful modal popup
  - Two clear options with icons
  - Cancel button
  - Click outside to dismiss

#### CSS Additions
- `.message-actions-wrapper` - Container for 3-dot button
- `.message-menu-toggle-btn` - 3-dot button styling
- `.message-actions-popup` - Horizontal icon menu
- `.message-action-btn` - Individual action buttons
- `.message-edit-container` - Edit mode UI
- `.message-edit-input` - Edit textarea
- `.message-edit-actions` - Save/Cancel buttons
- `.edited-indicator` - "(edited)" text styling
- `.deleted-message` - Deleted message styling
- `.delete-confirmation-overlay` - Modal overlay
- `.delete-confirmation-modal` - Popup modal
- `.btn-delete-for-me` / `.btn-delete-for-everyone` - Delete option buttons

#### Modified Files
- `frontend/src/services/websocket.js` - Added edit/delete methods
- `frontend/src/utils/store.js` - Added message update/hide functions
- `frontend/src/pages/Chat.jsx` - Handle edit/delete events
- `frontend/src/components/ChatArea.jsx` - Complete UI implementation
- `frontend/src/styles/chatarea.css` - All new styling

### 🔧 Technical Details

#### WebSocket Edit Message Format
```javascript
{
  type: 'edit_message',
  message_id: 123,
  content: 'Updated message text'
}
```

#### WebSocket Delete Message Format
```javascript
{
  type: 'delete_message',
  message_id: 123,
  delete_for_everyone: true // or false
}
```

#### Edit Event Response
```javascript
{
  type: 'message_edited',
  message_id: 123,
  content: 'Updated text',
  is_edited: true,
  edited_at: '2026-03-19T16:00:00'
}
```

#### Delete Event Response
```javascript
{
  type: 'message_deleted',
  message_id: 123,
  delete_for_everyone: true
}
```

### 🎯 UI/UX Improvements

- **Message Alignment**: All messages perfectly aligned regardless of actions menu
- **Hover States**: Smooth transitions for action buttons
- **Visual Feedback**: Clear indicators for edited/deleted messages
- **Responsive Design**: Works on all screen sizes
- **Keyboard Support**: Enter/Esc shortcuts in edit mode
- **Auto-scroll**: Prevents edit UI from being hidden by input area

### 🐛 Bug Fixes

- Fixed message alignment issues when action buttons appear
- Fixed dropdown menu positioning and visibility
- Fixed edit mode overlap with input area on last message
- Fixed flexbox layout for consistent message bubble sizing

### 🔄 Migration Guide

No database migration needed! The `is_edited` and `is_deleted` columns already exist.

```bash
# 1. Pull latest code
git pull

# 2. Restart backend
cd backend
# Backend will automatically work with new endpoints

# 3. Clear browser cache and reload frontend
# Frontend will automatically use new features
```

### ⚠️ Breaking Changes

None - Fully backward compatible!

---

## [v2.0.1] - 2026-03-17

### 🔧 Bug Fixes & Improvements

#### Database Initialization
- ✅ **Fixed**: Replaced `apply_migration.py` with `init_db.py`
- ✅ **Reason**: `apply_migration.py` failed when `messages` table didn't exist
- ✅ **Solution**: New `init_db.py` creates all tables from SQLAlchemy models in correct order
- ✅ **Benefit**: Cleaner initialization, no dependency issues

#### Files Changed
- **Removed**:
  - `backend/apply_migration.py` - Replaced by init_db.py
  - `backend/create_attachments_table.sql` - No longer needed
- **Added**:
  - `backend/init_db.py` - Universal database initialization script

#### Documentation Updates
- Updated `QUICKSTART.md` - Changed migration step to use `init_db.py`
- Updated `README.md` - Added database initialization instructions
- Fixed all paths from `~/first-chat` to `~/projects/Minz-chat`

### 🔄 Migration from v2.0.0

If you already ran `apply_migration.py` successfully, no action needed!

If you encountered the "messages does not exist" error:
```bash
cd ~/projects/Minz-chat/backend
source venv/bin/activate
python3 init_db.py
```

---

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

# 2. Initialize database (creates all tables)
cd backend
python3 init_db.py

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
