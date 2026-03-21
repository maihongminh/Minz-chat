# 📱 Mobile Features Guide

> Complete guide for mobile-first experience in HiHi Chat
> Version 2.6.0 - March 21, 2026

## 🎯 Overview

HiHi Chat now includes a comprehensive mobile-first experience optimized for devices with screen width ≤768px. This guide covers all mobile-specific features and how to use them.

## 📱 Mobile Home Screen

### What is it?
A dedicated home screen that appears on mobile devices, replacing the traditional sidebar navigation.

### Features
- **Channels List**: All available chat rooms with unread message badges
- **Direct Messages List**: All users (excluding yourself) with unread badges
- **User Menu**: Access to profile, settings, and logout

### How to access
- Automatically appears when viewport width ≤ 768px
- Shows upon app launch on mobile devices

### UI Layout
```
┌────────────────────────────┐
│ HiHi Chat          [👤]    │ ← Header with user menu
├────────────────────────────┤
│                            │
│ Channels ▼                 │
│ • general           [2]    │ ← Unread badge
│ • random                   │
│ • announcements            │
│                            │
│ Direct Messages ▼          │
│ • alice             [5]    │
│ • bob                      │
│ • charlie           [1]    │
│                            │
└────────────────────────────┘
```

## 🔙 Navigation System

### Back Button
- Appears in ChatArea header (← icon)
- Located on the left side, before channel/user name
- Click to return to Mobile Home Screen

### Navigation Flow
```
Mobile Home → Select Channel/DM → Chat View
      ↑                                  ↓
      └──────── Back Button ─────────────┘
```

## 👤 Mobile User Menu

### Accessing the Menu
1. Click on user avatar (top-right corner)
2. Dropdown menu appears with overlay

### Menu Options

#### 1. Profile
View your complete profile information:
- Avatar
- Username
- Role (User/Moderator/Admin/Super Admin)
- Email address

Click "Edit Profile" button to modify.

#### 2. Edit Profile
Modify your profile details:

**Username**
- Text input field
- Required field
- Updates immediately after saving

**Avatar Upload**
- Click on current avatar to change
- Hover to see "Change Avatar" overlay
- File requirements:
  - Image files only (jpg, png, gif, etc.)
  - Maximum size: 5MB
  - Automatically converts to base64
  - Preview updates immediately

**Buttons**
- Cancel: Dismiss changes
- Save Changes: Update profile

#### 3. Change Password
Secure password modification:

**Form Fields**
- Current Password (required)
- New Password (required, min 6 chars)
- Confirm New Password (must match)

**Validation**
- All fields must be filled
- New passwords must match
- Minimum 6 characters
- Current password must be correct

**Buttons**
- Cancel: Dismiss without changes
- Change Password: Update password

#### 4. Logout
- Sign out from the application
- Returns to login screen
- Disconnects WebSocket connection

## 📏 Responsive Image Sizes

### Attachment Optimization

Images and attachments are automatically resized based on screen size:

| Device Type | Screen Width | Max Image Height |
|-------------|--------------|------------------|
| Desktop     | > 768px      | 250px           |
| Tablet      | ≤ 768px      | 200px           |
| Mobile      | ≤ 480px      | 180px           |

### Benefits
- Faster loading on mobile
- Better use of screen space
- Prevents message bubble overflow
- Maintains image aspect ratios

## 🎯 Hamburger Menu (Desktop Collapsed Mode)

### Position
- Top-right corner on mobile
- Fixed position with z-index priority
- Enhanced styling: background, border, shadow

### Behavior
- Click to toggle sidebar on desktop
- Click to open/close sidebar on mobile
- Automatically positioned for thumb access
- Visual feedback on hover

### Design
```css
Position: fixed
Top: 12px
Right: 12px
Size: 40x40px
Background: Semi-transparent
Shadow: Depth effect
```

## 📱 Breakpoints

### Mobile Detection
```javascript
Mobile View: width ≤ 768px
Small Mobile: width ≤ 480px
Desktop: width > 768px
```

### Automatic Switching
- Detects viewport resize
- Switches between mobile/desktop layouts
- Preserves state when possible
- Resets collapsed state on mobile

## 🎨 UI Components

### Mobile Modals

All mobile modals share consistent design:

**Structure**
- Overlay backdrop (semi-transparent black)
- Centered modal card
- Header with title and close button (X)
- Content area with form/information
- Action buttons at bottom

**Styling**
- Max width: 400px
- Max height: 90vh
- Border radius: 12px
- Smooth animations
- Click outside to close

### Avatar Upload Interface

**Visual Design**
- Circular avatar preview (100x100px)
- Hover overlay with icon and text
- Upload via file picker
- Immediate preview after selection

**User Feedback**
- Loading state during upload
- Success alert on completion
- Error alert for validation failures

## 🔒 Security & Validation

### Avatar Upload
- File type check (images only)
- Size limit: 5MB maximum
- Base64 encoding for transmission
- Server-side validation

### Password Change
- Current password verification
- Minimum length: 6 characters
- Confirmation matching
- Secure transmission via HTTPS

## 💡 Best Practices

### For Users

1. **Navigation**
   - Use back button to return to home
   - Swipe/scroll through message lists
   - Tap to select channels/DMs

2. **Profile Management**
   - Keep avatar under 5MB
   - Use clear, recognizable images
   - Choose strong passwords (8+ chars recommended)

3. **Performance**
   - Close modals when done
   - Return to home when switching chats
   - Keep browser updated

### For Developers

1. **Testing**
   - Test at 768px, 480px, and 375px widths
   - Verify both portrait and landscape
   - Check touch interactions
   - Test file upload on actual devices

2. **Maintenance**
   - Keep breakpoints consistent
   - Follow mobile-first CSS approach
   - Optimize images before deployment
   - Monitor performance metrics

## 🐛 Troubleshooting

### Issue: Home screen doesn't appear on mobile
**Solution**: Check viewport width, should be ≤768px

### Issue: Avatar upload fails
**Solution**: 
- Check file size (max 5MB)
- Ensure file is an image
- Check network connection

### Issue: Back button doesn't work
**Solution**: 
- Ensure you're in a chat view
- Check if mobile view is active
- Refresh the page

### Issue: Hamburger menu overlaps title
**Solution**: 
- Update to latest version (v2.6.0+)
- Clear browser cache
- Check CSS is loading correctly

## 📊 Technical Details

### New Components
```
MobileHome.jsx      - Main mobile home screen
  ├── Channels list
  ├── DMs list  
  └── User menu dropdown
```

### New Styles
```
mobilehome.css      - Mobile-specific styles
  ├── Home screen layout
  ├── Modal designs
  ├── Avatar upload UI
  └── Form styling
```

### State Management
```javascript
// Added to ChatStore
users: []           // All users list
setUsers: (users)   // Set users action

// Mobile-specific state
showMobileHome      // Toggle home/chat view
isMobile            // Device detection
```

### Navigation Logic
```javascript
Desktop (>768px):
  Sidebar + ChatArea + UserList

Mobile (≤768px):
  If showMobileHome: MobileHome
  Else: ChatArea with back button
```

## 🎉 Summary

The mobile experience provides:
- ✅ Intuitive home screen navigation
- ✅ Complete profile management
- ✅ Optimized image sizes
- ✅ Thumb-friendly UI positioning
- ✅ Secure password management
- ✅ Seamless mobile/desktop switching

## 📝 Version History

- **v2.6.0** (March 21, 2026) - Initial mobile-first release
  - Mobile home screen
  - User menu and modals
  - Responsive optimizations
  - Back navigation

---

For more information, see:
- [README.md](README.md) - Main documentation
- [CHANGELOG.md](CHANGELOG.md) - Version history
- [QUICKSTART.md](QUICKSTART.md) - Installation guide
