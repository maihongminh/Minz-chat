import React, { useState } from 'react'
import { FaHashtag, FaUserCircle, FaLock, FaCog, FaSignOutAlt, FaUser, FaTimes, FaEdit } from 'react-icons/fa'
import { useChatStore, useAuthStore } from '../utils/store'
import { usersAPI } from '../services/api'
import '../styles/mobilehome.css'

function MobileHome({ onSelectRoom, onSelectPrivateChat, onLogout }) {
  const { user: currentUser, setAuth } = useAuthStore()
  const { rooms, users, unreadRooms, unreadPrivateChats } = useChatStore()
  const [showUserMenu, setShowUserMenu] = useState(false)
  const [showProfile, setShowProfile] = useState(false)
  const [showEditProfile, setShowEditProfile] = useState(false)
  const [showChangePassword, setShowChangePassword] = useState(false)
  const [editName, setEditName] = useState('')
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  
  // Filter out current user from the list
  const otherUsers = users.filter(u => u.id !== currentUser?.id)

  const handleAvatarChange = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file')
      return
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('File size must be less than 5MB')
      return
    }

    try {
      // Convert to base64
      const reader = new FileReader()
      reader.onloadend = async () => {
        const base64String = reader.result
        const response = await usersAPI.updateProfile({ avatar_url: base64String })
        setAuth(currentUser.token, response.data)
        alert('Avatar updated successfully!')
      }
      reader.readAsDataURL(file)
    } catch (error) {
      console.error('Failed to update avatar:', error)
      alert(error.response?.data?.detail || 'Failed to update avatar')
    }
  }

  const handleUpdateProfile = async () => {
    if (!editName.trim()) return
    
    try {
      const response = await usersAPI.updateProfile({ username: editName })
      setAuth(currentUser.token, response.data)
      setShowEditProfile(false)
      setEditName('')
      alert('Profile updated successfully!')
    } catch (error) {
      console.error('Failed to update profile:', error)
      alert(error.response?.data?.detail || 'Failed to update profile')
    }
  }

  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      alert('Please fill all fields')
      return
    }
    
    if (newPassword !== confirmPassword) {
      alert('New passwords do not match')
      return
    }

    if (newPassword.length < 6) {
      alert('Password must be at least 6 characters')
      return
    }
    
    try {
      await usersAPI.changePassword({
        current_password: currentPassword,
        new_password: newPassword
      })
      
      setShowChangePassword(false)
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
      alert('Password changed successfully!')
    } catch (error) {
      console.error('Failed to change password:', error)
      alert(error.response?.data?.detail || 'Failed to change password')
    }
  }

  return (
    <div className="mobile-home">
      <div className="mobile-home-header">
        <h2>HiHi Chat</h2>
        <div className="mobile-home-user">
          <button 
            className="mobile-user-btn"
            onClick={() => setShowUserMenu(!showUserMenu)}
          >
            {currentUser?.avatar_url ? (
              <img src={currentUser.avatar_url} alt="" className="mobile-user-avatar" />
            ) : (
              <FaUserCircle />
            )}
          </button>
          {showUserMenu && (
            <>
              <div 
                className="mobile-menu-overlay" 
                onClick={() => setShowUserMenu(false)}
              />
              <div className="mobile-user-menu">
                <div className="mobile-menu-header">
                  <div className="mobile-menu-user-info">
                    {currentUser?.avatar_url ? (
                      <img src={currentUser.avatar_url} alt="" className="mobile-menu-avatar" />
                    ) : (
                      <FaUserCircle className="mobile-menu-avatar-icon" />
                    )}
                    <div>
                      <div className="mobile-menu-username">{currentUser?.username}</div>
                      <div className="mobile-menu-role">{currentUser?.role}</div>
                    </div>
                  </div>
                </div>
                <div className="mobile-menu-items">
                  <button 
                    className="mobile-menu-item"
                    onClick={() => {
                      setShowUserMenu(false)
                      setShowProfile(true)
                    }}
                  >
                    <FaUser /> Profile
                  </button>
                  <button 
                    className="mobile-menu-item"
                    onClick={() => {
                      setShowUserMenu(false)
                      setShowChangePassword(true)
                    }}
                  >
                    <FaCog /> Change Password
                  </button>
                  <button 
                    className="mobile-menu-item logout"
                    onClick={() => {
                      setShowUserMenu(false)
                      onLogout()
                    }}
                  >
                    <FaSignOutAlt /> Logout
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      <div className="mobile-home-content">
        {/* Channels Section */}
        <div className="home-section">
          <div className="section-title">Channels</div>
          <div className="home-list">
            {rooms.length === 0 ? (
              <div className="empty-message">No channels available</div>
            ) : (
              rooms.map((room) => {
                const unreadCount = unreadRooms[room.id] || 0
                return (
                  <div
                    key={room.id}
                    className="home-item"
                    onClick={() => onSelectRoom(room)}
                  >
                    <div className="home-item-icon">
                      {room.is_private ? <FaLock /> : <FaHashtag />}
                    </div>
                    <div className="home-item-info">
                      <div className="home-item-name">
                        {room.name}
                        {unreadCount > 0 && (
                          <span className="home-unread-badge">{unreadCount}</span>
                        )}
                      </div>
                      {room.description && (
                        <div className="home-item-desc">{room.description}</div>
                      )}
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </div>

        {/* Direct Messages Section */}
        <div className="home-section">
          <div className="section-title">Direct Messages</div>
          <div className="home-list">
            {otherUsers.length === 0 ? (
              <div className="empty-message">No users available</div>
            ) : (
              otherUsers.map((user) => {
                const unreadCount = unreadPrivateChats[user.id] || 0
                return (
                  <div
                    key={user.id}
                    className="home-item"
                    onClick={() => onSelectPrivateChat(user)}
                  >
                    <div className="home-item-icon">
                      {user.avatar_url ? (
                        <img src={user.avatar_url} alt="" className="home-avatar" />
                      ) : (
                        <FaUserCircle />
                      )}
                    </div>
                    <div className="home-item-info">
                      <div className="home-item-name">
                        {user.username}
                        {unreadCount > 0 && (
                          <span className="home-unread-badge">{unreadCount}</span>
                        )}
                      </div>
                      {user.role && (
                        <div className="home-item-desc">{user.role}</div>
                      )}
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </div>
      </div>

      {/* Profile Modal */}
      {showProfile && (
        <div className="mobile-modal-overlay" onClick={() => setShowProfile(false)}>
          <div className="mobile-modal" onClick={(e) => e.stopPropagation()}>
            <div className="mobile-modal-header">
              <h3>Profile</h3>
              <button onClick={() => setShowProfile(false)}>
                <FaTimes />
              </button>
            </div>
            <div className="mobile-modal-content">
              <div className="mobile-profile-info">
                {currentUser?.avatar_url ? (
                  <img src={currentUser.avatar_url} alt="" className="mobile-profile-avatar" />
                ) : (
                  <FaUserCircle className="mobile-profile-avatar-icon" />
                )}
                <div className="mobile-profile-details">
                  <div className="mobile-profile-name">{currentUser?.username}</div>
                  <div className="mobile-profile-role">{currentUser?.role}</div>
                  <div className="mobile-profile-email">{currentUser?.email}</div>
                </div>
              </div>
              <div className="mobile-modal-actions">
                <button 
                  className="mobile-btn-primary"
                  onClick={() => {
                    setEditName(currentUser?.username || '')
                    setShowProfile(false)
                    setShowEditProfile(true)
                  }}
                >
                  <FaEdit /> Edit Profile
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Profile Modal */}
      {showEditProfile && (
        <div className="mobile-modal-overlay" onClick={() => setShowEditProfile(false)}>
          <div className="mobile-modal" onClick={(e) => e.stopPropagation()}>
            <div className="mobile-modal-header">
              <h3>Edit Profile</h3>
              <button onClick={() => setShowEditProfile(false)}>
                <FaTimes />
              </button>
            </div>
            <div className="mobile-modal-content">
              <div className="mobile-avatar-upload">
                <input
                  type="file"
                  id="mobile-avatar-input"
                  accept="image/*"
                  onChange={handleAvatarChange}
                  style={{ display: 'none' }}
                />
                <label htmlFor="mobile-avatar-input" className="mobile-avatar-upload-btn">
                  {currentUser?.avatar_url ? (
                    <img src={currentUser.avatar_url} alt="" className="mobile-avatar-preview" />
                  ) : (
                    <FaUserCircle className="mobile-avatar-preview-icon" />
                  )}
                  <div className="mobile-avatar-upload-overlay">
                    <FaEdit />
                    <span>Change Avatar</span>
                  </div>
                </label>
              </div>
              <div className="mobile-form-group">
                <label>Username</label>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  placeholder="Enter new username"
                />
              </div>
              <div className="mobile-modal-actions">
                <button className="mobile-btn-secondary" onClick={() => setShowEditProfile(false)}>
                  Cancel
                </button>
                <button className="mobile-btn-primary" onClick={handleUpdateProfile}>
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Change Password Modal */}
      {showChangePassword && (
        <div className="mobile-modal-overlay" onClick={() => setShowChangePassword(false)}>
          <div className="mobile-modal" onClick={(e) => e.stopPropagation()}>
            <div className="mobile-modal-header">
              <h3>Change Password</h3>
              <button onClick={() => setShowChangePassword(false)}>
                <FaTimes />
              </button>
            </div>
            <div className="mobile-modal-content">
              <div className="mobile-form-group">
                <label>Current Password</label>
                <input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="Enter current password"
                />
              </div>
              <div className="mobile-form-group">
                <label>New Password</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Enter new password"
                />
              </div>
              <div className="mobile-form-group">
                <label>Confirm New Password</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm new password"
                />
              </div>
              <div className="mobile-modal-actions">
                <button className="mobile-btn-secondary" onClick={() => setShowChangePassword(false)}>
                  Cancel
                </button>
                <button className="mobile-btn-primary" onClick={handleChangePassword}>
                  Change Password
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default MobileHome
