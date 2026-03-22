# Changelog - Minz Chat Application

## [v2.1.0] - 2026-03-22

### 📌 Pin Messages Feature

#### Added
- **Pin Messages**: Users can now pin important messages to the top of chat
  - Pin up to 5 messages per room or private chat
  - Beautiful gradient banner displays pinned messages at top of chat area
  - Click pin icon (📌) in message menu to pin/unpin
  - Dropdown view when multiple messages are pinned
  - Click pinned message to scroll to original location
  - All users can pin messages (not restricted to admins)
  - Real-time sync via WebSocket for all participants

#### Features
- **Visual Banner**: 
  - Purple gradient banner (Discord-inspired design)
  - Shows message content, sender, and timestamp
  - Displays who pinned the message
  - Auto-collapse when no pinned messages
  
- **Multi-Pin Support**:
  - Pin up to 5 messages simultaneously
  - First message shown in banner preview
  - Click dropdown arrow to see all pinned messages
  - Individual unpin buttons for each message
  
- **Smart Limits**:
  - Server-side validation prevents exceeding 5 pins
  - Error message when limit reached
  - Auto-unpin when message is deleted

#### Database Changes
- Added 3 columns to `messages` table:
  - `is_pinned` (BOOLEAN, default FALSE, indexed)
  - `pinned_at` (TIMESTAMP, nullable)
  - `pinned_by_user_id` (INTEGER, Foreign Key to users, nullable)
- Created index on `is_pinned` for query performance
- Migration script provided: `backend/add_pin_migration.py`

**⚠️ Important for Existing Installations:**

If you're upgrading from a previous version, you **MUST** run the migration script:

```bash
cd backend
source venv/bin/activate
python add_pin_migration.py
```

This will add the pin columns to the messages table.

**Expected Output:**
```
🔧 Starting migration: Add pin columns to messages table
📝 Adding pin columns to messages table...
✅ Added is_pinned column
✅ Added pinned_at column
✅ Added pinned_by_user_id column
✅ Created index on is_pinned column
✅ Migration completed successfully!
🎉 Pin message feature is now ready to use!
```

#### Modified Files

**Backend (4 files):**
- `backend/app/models/message.py` - Added pin columns and relationship
- `backend/app/schemas/message.py` - Added pin fields to schemas
- `backend/app/api/messages.py` - Added 4 new pin/unpin endpoints
- `backend/app/services/websocket.py` - Added pin/unpin WebSocket handlers

**Frontend (4 files):**
- `frontend/src/components/PinnedMessages.jsx` - **NEW**: Banner component
- `frontend/src/styles/pinnedmessages.css` - **NEW**: Banner styles
- `frontend/src/components/ChatArea.jsx` - Integrated PinnedMessages component
- `frontend/src/services/websocket.js` - Added pinMessage/unpinMessage methods
- `frontend/src/pages/Chat.jsx` - Added pin event handlers

**Migration & Documentation (5 files):**
- `backend/add_pin_migration.py` - **NEW**: Migration script
- `backend/add_pin_columns.sql` - **NEW**: SQL migration
- `PIN_MESSAGE_GUIDE.md` - **NEW**: Complete feature guide
- `CHANGELOG_PIN_FEATURE.md` - **NEW**: Detailed changelog
- `IMPLEMENTATION_SUMMARY.md` - **NEW**: Implementation summary

#### API Endpoints

**New REST Endpoints:**
- `POST /api/messages/{message_id}/pin` - Pin a message
- `DELETE /api/messages/{message_id}/pin` - Unpin a message
- `GET /api/messages/pinned/room/{room_id}` - Get pinned messages in room
- `GET /api/messages/pinned/private/{user_id}` - Get pinned messages in private chat

**WebSocket Events:**
- Client → Server: `pin_message`, `unpin_message`
- Server → Client: `message_pinned`, `message_unpinned`, `error`

#### Technical Details
- Database: PostgreSQL with indexed `is_pinned` column
- Real-time: WebSocket broadcasting to all room/chat participants
- Validation: Maximum 5 pins enforced server-side
- UI: React component with Zustand state management
- Performance: Optimized queries with proper indexing

#### Bug Fixes
- Fixed infinite loop in ChatArea.jsx (useEffect dependency issue)
- Proper cleanup of event listeners
- Stable dependencies to prevent unnecessary re-renders

---

## [v2.3.0] - 2026-03-21

### 🎉 Message Reactions Feature

#### Added
- **Message Reactions**: Users can now react to any message with emoji reactions
  - 6 emoji options: 👍 ❤️ 😂 😮 😢 🙏
  - Click smile icon (😊) in message menu to add reactions
  - Click reaction to toggle (add/remove)
  - Reactions display inline below messages
  - Realtime updates via WebSocket
  - Works in both Rooms and Private messages

#### Features
- **Compact Design**: Small, inline reactions that don't disrupt message flow
- **Smart Spacing**: Messages with reactions automatically get extra spacing
- **Position Aware**: Reactions align left for others, right for your messages
- **Visual Feedback**: Highlighted background for your reactions
- **Counter Display**: Shows how many users reacted
- **Hover Tooltip**: See who reacted by hovering over reaction

#### Database Changes
- Added `message_reactions` table with columns:
  - `id` (Primary Key)
  - `message_id` (Foreign Key to messages)
  - `user_id` (Foreign Key to users)
  - `emoji` (VARCHAR(10))
  - `created_at` (TIMESTAMP)
  - Unique constraint on (message_id, user_id, emoji)

**⚠️ Important for Existing Installations:**

If you're upgrading from a previous version, you **MUST** run the migration script:

```bash
cd first-chat/backend
python3 add_reactions_table.py
```

This will create the `message_reactions` table.

#### Modified Files

**Backend (10 files):**
- `backend/app/models/reaction.py` - **NEW**: Reaction model
- `backend/app/schemas/reaction.py` - **NEW**: Reaction schemas
- `backend/app/api/reactions.py` - **NEW**: Reaction API endpoints
- `backend/add_reactions_table.py` - **NEW**: Migration script
- `backend/app/models/__init__.py` - Added MessageReaction export
- `backend/app/models/message.py` - Added reactions relationship
- `backend/app/models/user.py` - Added reactions relationship
- `backend/app/schemas/__init__.py` - Added reaction schemas
- `backend/app/services/websocket.py` - Added broadcast_reaction method
- `backend/app/main.py` - Registered reactions router

**Frontend (5 files):**
- `frontend/src/components/ReactionPicker.jsx` - **NEW**: Emoji picker modal
- `frontend/src/services/reactions.js` - **NEW**: Reactions API service
- `frontend/src/styles/reactions.css` - **NEW**: Reactions styles
- `frontend/src/components/ChatArea.jsx` - Added reaction UI and handlers
- `frontend/src/pages/Chat.jsx` - Added WebSocket reaction event handler

#### Technical Details
- REST API: POST/DELETE/GET `/api/reactions/messages/{id}`
- WebSocket event type: `reaction` with actions: `add`, `remove`
- CSS: Smart spacing with `:has()` selector
- Position: Absolute positioning, adapts to message side

---

## [v2.2.0] - 2026-03-20

### 🎯 Reply to Messages Feature

#### Added
- **Reply to Messages**: Users can now reply to any message in the chat
  - Click the reply icon (↩️) in message actions menu to quote a message
  - Quoted message appears in the input area with option to cancel
  - Reply messages show a quote box with original message preview
  - Click on quote box to jump to the original message with smooth scroll and highlight animation

#### Features
- **Message Quoting**:
  - Visual quote box showing sender name and message preview
  - Supports quoting text-only messages, messages with attachments, and file messages
  - Works in both regular messages and compact mode
  - Consistent alignment with message content
  
- **Navigation**:
  - Click on any quote to scroll to the original message
  - Original message highlights with blue animation for 2 seconds
  - Smooth scroll animation for better UX

#### Database Changes
- Added `reply_to_message_id` column to `messages` table (INTEGER, nullable, Foreign Key)
- Added relationship to support message threading
- Migration script provided: `backend/add_reply_column.py`

**⚠️ Important for Existing Installations:**

If you're upgrading from a previous version, you **MUST** run the migration script:

```bash
cd backend
python3 add_reply_column.py
```

This will add the `reply_to_message_id` column to your existing `messages` table.

#### Modified Files

**Backend:**
- `backend/app/models/message.py` - Added `reply_to_message_id` field and `reply_to` relationship
- `backend/app/schemas/message.py` - Added `reply_to` field to `MessageResponse` schema
- `backend/app/api/messages.py` - Updated `_build_message_response` to include reply_to data
- `backend/app/services/websocket.py` - Added support for `reply_to_message_id` in send_message handler
- `backend/add_reply_column.py` - **NEW**: Migration script for existing databases

**Frontend:**
- `frontend/src/components/ChatArea.jsx`:
  - Added reply button to message actions menu
  - Added replying indicator UI at bottom of chat
  - Added quote rendering in all message types (5 locations)
  - Added `scrollToMessage()` function for click-to-scroll
  - Added `highlightedMessageId` state for animation
  - Added unique `id` attribute to each message element
- `frontend/src/pages/Chat.jsx` - Cleaned up debug logs
- `frontend/src/services/websocket.js` - Added `replyToMessageId` parameter to `sendMessage()`
- `frontend/src/styles/chatarea.css`:
  - Added `.quoted-message` styles with hover effects
  - Added `.replying-indicator` styles
  - Added `.highlighted` class with `highlightPulse` animation
  - Fixed message alignment for compact mode with `margin-left: 56px`

---

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

## [v2.6.0] - March 21, 2026

### 🎉 Mobile-First Experience Release

#### 📱 New Mobile Features

**Mobile Home Screen**
- Added dedicated home screen for mobile devices (≤768px)
- Displays all channels with unread message badges
- Displays all direct messages (excluding current user) with unread badges
- Click navigation to enter chat rooms or DMs

**Mobile Navigation**
- Added back button (←) in ChatArea header for mobile
- Smooth transitions between Home and Chat views
- Proper state management for mobile vs desktop navigation

**Mobile User Menu**
- User avatar button in top-right corner of Home screen
- Comprehensive dropdown menu with:
  - Profile viewer (avatar, username, role, email)
  - Edit Profile modal with avatar upload
  - Change Password modal with validation
  - Logout functionality

**Profile Management on Mobile**
- View complete profile information
- Edit username with real-time validation
- Upload/change avatar with:
  - File type validation (images only)
  - Size validation (max 5MB)
  - Base64 encoding for upload
  - Instant preview after upload
- Change password with security validation:
  - Current password verification
  - New password confirmation
  - Minimum length requirement (6 chars)

**Responsive Optimizations**
- Optimized attachment/image sizes:
  - Desktop: max-height 250px (reduced from 300px)
  - Mobile (≤768px): max-height 200px
  - Small mobile (≤480px): max-height 180px
- Prevents image overflow from message bubbles
- Maintains aspect ratios

**UI/UX Improvements**
- Hamburger menu repositioned to top-right for thumb-friendly access
- Enhanced styling with background, border, and shadow
- Fixed state conflicts between collapsed (desktop) and mobile modes
- Auto-reset collapsed state when switching to mobile view
- Smooth animations and transitions

#### 🔧 Technical Changes

**New Components**
- `MobileHome.jsx` - Dedicated mobile home screen component
- Mobile-specific modals: Profile, Edit Profile, Change Password

**New Styles**
- `mobilehome.css` - Complete mobile-specific stylesheet
- Modal overlays and forms
- Avatar upload interface
- Responsive breakpoints

**Store Updates**
- Added `users` array to ChatStore
- Added `setUsers` action
- Shared data between MobileHome and UserList components

**Component Updates**
- `Chat.jsx` - Mobile/desktop view switching logic
- `ChatArea.jsx` - Added back button and mobile detection
- `Sidebar.jsx` - Fixed hamburger position and mobile state handling
- `UserList.jsx` - Now uses store data instead of props

**CSS Improvements**
- Fixed hamburger button position (left → right)
- Added max-width constraints for attachments
- Enhanced mobile responsiveness at 768px and 480px breakpoints
- Improved message bubble overflow handling

#### 📝 Files Changed
```
frontend/src/components/
  - ChatArea.jsx (added back button)
  - MobileHome.jsx (NEW)
  - Sidebar.jsx (fixed hamburger, mobile state)
  - UserList.jsx (use store data)

frontend/src/pages/
  - Chat.jsx (mobile routing logic)

frontend/src/styles/
  - chatarea.css (back button, attachment sizes)
  - mobilehome.css (NEW)
  - sidebar.css (hamburger position)

frontend/src/utils/
  - store.js (added users array)
```

#### 🎯 Migration Notes
- No backend changes required
- No database migrations needed
- Purely frontend enhancement
- Backward compatible with existing features
- Automatic detection and switching based on viewport width

#### 🧪 Testing Checklist
- [x] Mobile home screen displays channels and DMs
- [x] Back button navigates to home
- [x] User menu opens and closes properly
- [x] Profile viewer shows correct information
- [x] Edit profile updates username and avatar
- [x] Change password validates and updates
- [x] Attachments resize correctly on mobile
- [x] Hamburger menu accessible at top-right
- [x] Smooth transitions between views
- [x] Desktop mode unaffected
- [x] Responsive at 768px and 480px breakpoints

