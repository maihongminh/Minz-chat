import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { FaHashtag, FaPlus, FaSignOutAlt, FaUserCircle, FaUserShield, FaTimes, FaUser, FaLock } from 'react-icons/fa'
import { useChatStore, useAuthStore } from '../utils/store'
import { roomsAPI, usersAPI } from '../services/api'
import '../styles/sidebar.css'

function Sidebar({ onLogout }) {
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const { rooms, currentRoom, setCurrentRoom, setRooms, ws, unreadRooms } = useChatStore()
  const [showCreateRoom, setShowCreateRoom] = useState(false)
  const [newRoomName, setNewRoomName] = useState('')
  const [newRoomDesc, setNewRoomDesc] = useState('')
  const [isPrivateRoom, setIsPrivateRoom] = useState(false)
  const [showProfile, setShowProfile] = useState(false)
  const [showEditProfile, setShowEditProfile] = useState(false)
  const [showChangePassword, setShowChangePassword] = useState(false)
  const [editName, setEditName] = useState('')
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  const isAdmin = user?.role === 'admin' || user?.role === 'super_admin'

  const handleCreateRoom = async (e) => {
    e.preventDefault()
    if (!newRoomName.trim()) return

    try {
      const response = await roomsAPI.createRoom({
        name: newRoomName,
        description: newRoomDesc,
        is_private: isPrivateRoom
      })

      const roomsRes = await roomsAPI.getRooms()
      setRooms(roomsRes.data)
      
      setNewRoomName('')
      setNewRoomDesc('')
      setIsPrivateRoom(false)
      setShowCreateRoom(false)
      
      // Auto-select the new room
      setCurrentRoom(response.data)
      if (ws) {
        ws.joinRoom(response.data.id)
      }
    } catch (error) {
      console.error('Failed to create room:', error)
      alert(error.response?.data?.detail || 'Failed to create room')
    }
  }

  const handleRoomClick = (room) => {
    // Check if room is private and user is not admin
    if (room.is_private && !isAdmin) {
      alert('This is a private channel. Only administrators can access it.')
      return
    }
    
    setCurrentRoom(room)
    if (ws) {
      ws.joinRoom(room.id)
    }
  }

  const handleEditProfile = async (e) => {
    e.preventDefault()
    if (!editName.trim()) return

    try {
      await usersAPI.updateProfile({ full_name: editName })
      // Update user in store
      useAuthStore.setState({ user: { ...user, full_name: editName } })
      alert('Profile updated successfully!')
      setShowEditProfile(false)
      setEditName('')
    } catch (error) {
      console.error('Failed to update profile:', error)
      alert(error.response?.data?.detail || 'Failed to update profile')
    }
  }

  const handleChangePassword = async (e) => {
    e.preventDefault()
    
    if (newPassword !== confirmPassword) {
      alert('New passwords do not match!')
      return
    }

    if (newPassword.length < 6) {
      alert('New password must be at least 6 characters')
      return
    }

    try {
      await usersAPI.changePassword({
        current_password: currentPassword,
        new_password: newPassword
      })
      alert('Password changed successfully!')
      setShowChangePassword(false)
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
    } catch (error) {
      console.error('Failed to change password:', error)
      alert(error.response?.data?.detail || 'Failed to change password')
    }
  }

  const openEditProfile = () => {
    setEditName(user?.full_name || '')
    setShowEditProfile(true)
    setShowProfile(false)
  }

  const openChangePassword = () => {
    setShowChangePassword(true)
    setShowProfile(false)
  }

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
      // Convert to base64 or upload to server
      const reader = new FileReader()
      reader.onloadend = async () => {
        const base64String = reader.result
        await usersAPI.updateProfile({ avatar_url: base64String })
        // Update user in store
        useAuthStore.setState({ user: { ...user, avatar_url: base64String } })
        alert('Avatar updated successfully!')
      }
      reader.readAsDataURL(file)
    } catch (error) {
      console.error('Failed to update avatar:', error)
      alert(error.response?.data?.detail || 'Failed to update avatar')
    }
  }

  const handleDeleteRoom = async (e, room) => {
    e.stopPropagation() // Prevent room selection
    
    if (!window.confirm(`Are you sure you want to delete channel "${room.name}"?\n\nThis will delete all messages and cannot be undone!`)) {
      return
    }

    try {
      await roomsAPI.deleteRoom(room.id)
      
      // Refresh rooms list
      const roomsRes = await roomsAPI.getRooms()
      setRooms(roomsRes.data)
      
      // If deleted room was selected, clear selection
      if (currentRoom?.id === room.id) {
        setCurrentRoom(null)
      }
      
      alert(`Channel "${room.name}" has been deleted`)
    } catch (error) {
      console.error('Failed to delete room:', error)
      alert(error.response?.data?.detail || 'Failed to delete channel')
    }
  }

  return (
    <div className="sidebar">
      <div className="server-header">
        <h2>HiHi Chat</h2>
      </div>

      <div className="channels-section">
        <div className="section-header">
          <span>TEXT CHANNELS</span>
          {isAdmin && (
            <button 
              className="icon-btn" 
              onClick={() => setShowCreateRoom(true)}
              title="Create Channel (Admin only)"
            >
              <FaPlus />
            </button>
          )}
        </div>

        <div className="channels-list">
          {rooms.map((room) => {
            const unreadCount = unreadRooms[room.id] || 0
            const hasUnread = unreadCount > 0
            const isLocked = room.is_private && !isAdmin
            
            return (
              <div
                key={room.id}
                className={`channel-item ${currentRoom?.id === room.id ? 'active' : ''} ${hasUnread ? 'has-unread' : ''} ${isLocked ? 'locked' : ''}`}
                onClick={() => handleRoomClick(room)}
                title={isLocked ? 'Private channel - Admin only' : ''}
              >
                <div className="channel-icon-wrapper">
                  <FaHashtag className="channel-icon" />
                  {room.is_private && (
                    <FaLock className="lock-icon" />
                  )}
                </div>
                <span className="channel-name">{room.name}</span>
                <div className="channel-actions">
                  {hasUnread && (
                    <span className="unread-badge">{unreadCount}</span>
                  )}
                  {room.member_count > 0 && !hasUnread && (
                    <span className="member-count">{room.member_count}</span>
                  )}
                  {isAdmin && (
                    <button
                      className="icon-btn-small delete-btn"
                      onClick={(e) => handleDeleteRoom(e, room)}
                      title="Delete channel"
                    >
                      <FaTimes />
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      <div className="user-panel">
        <div className="user-info">
          {user?.avatar_url ? (
            <img src={user.avatar_url} alt={user.username} className="user-avatar" />
          ) : (
            <FaUserCircle className="user-avatar-default" />
          )}
          <div className="user-details">
            <div className="username">
              {user?.username}
              {isAdmin && <span className="admin-badge" title={user.role}>👑</span>}
            </div>
            <div className="user-status">Online</div>
          </div>
        </div>
        <div className="user-actions">
          {isAdmin && (
            <button 
              className="icon-btn" 
              onClick={() => navigate('/admin')} 
              title="Admin Panel"
            >
              <FaUserShield />
            </button>
          )}
          <button 
            className="icon-btn" 
            onClick={() => setShowProfile(true)} 
            title="Profile Settings"
          >
            <FaUser />
          </button>
          <button className="icon-btn" onClick={onLogout} title="Logout">
            <FaSignOutAlt />
          </button>
        </div>
      </div>

      {showCreateRoom && (
        <div className="modal-overlay" onClick={() => setShowCreateRoom(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3>Create Channel</h3>
            <form onSubmit={handleCreateRoom}>
              <div className="form-group">
                <label>Channel Name</label>
                <input
                  type="text"
                  value={newRoomName}
                  onChange={(e) => setNewRoomName(e.target.value)}
                  placeholder="general"
                  required
                  autoFocus
                />
              </div>
              <div className="form-group">
                <label>Description (Optional)</label>
                <textarea
                  value={newRoomDesc}
                  onChange={(e) => setNewRoomDesc(e.target.value)}
                  placeholder="Channel description"
                  rows="3"
                />
              </div>
              <div className="form-group">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={isPrivateRoom}
                    onChange={(e) => setIsPrivateRoom(e.target.checked)}
                  />
                  <span>Private Channel (Admin & Super Admin only)</span>
                </label>
                <small className="form-help-text">
                  Private channels are only visible and accessible to administrators
                </small>
              </div>
              <div className="modal-actions">
                <button type="button" className="btn-secondary" onClick={() => setShowCreateRoom(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  Create Channel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showProfile && (
        <div className="modal-overlay" onClick={() => setShowProfile(false)}>
          <div className="modal-content profile-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Profile Settings</h3>
              <button className="close-btn" onClick={() => setShowProfile(false)}>
                <FaTimes />
              </button>
            </div>
            
            <div className="profile-content">
              {/* Avatar Section */}
              <div className="profile-section">
                <div className="profile-avatar-wrapper">
                  {user?.avatar_url ? (
                    <img src={user.avatar_url} alt="Avatar" className="profile-avatar-large" />
                  ) : (
                    <FaUserCircle className="profile-avatar-large" />
                  )}
                  <input
                    type="file"
                    id="avatar-upload"
                    accept="image/*"
                    onChange={handleAvatarChange}
                    style={{ display: 'none' }}
                  />
                  <label htmlFor="avatar-upload" className="btn-change-avatar" style={{ cursor: 'pointer' }}>
                    Change Avatar
                  </label>
                </div>
              </div>

              {/* User Info Section */}
              <div className="profile-section">
                <h4>User Information</h4>
                <div className="profile-info">
                  <div className="info-row">
                    <span className="info-label">Username:</span>
                    <span className="info-value">{user?.username}</span>
                  </div>
                  <div className="info-row">
                    <span className="info-label">Email:</span>
                    <span className="info-value">{user?.email}</span>
                  </div>
                  <div className="info-row">
                    <span className="info-label">Role:</span>
                    <span className="info-value">{user?.role}</span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="profile-section">
                <h4>Settings</h4>
                <div className="profile-actions">
                  <button className="btn-profile-action" onClick={openEditProfile}>
                    Edit Profile
                  </button>
                  <button className="btn-profile-action" onClick={openChangePassword}>
                    Change Password
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {showEditProfile && (
        <div className="modal-overlay" onClick={() => setShowEditProfile(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Edit Profile</h3>
              <button className="close-btn" onClick={() => setShowEditProfile(false)}>
                <FaTimes />
              </button>
            </div>
            <form onSubmit={handleEditProfile}>
              <div className="form-group">
                <label>Full Name</label>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  placeholder="Enter your full name"
                  required
                  autoFocus
                />
              </div>
              <div className="modal-actions">
                <button type="button" className="btn-secondary" onClick={() => setShowEditProfile(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showChangePassword && (
        <div className="modal-overlay" onClick={() => setShowChangePassword(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Change Password</h3>
              <button className="close-btn" onClick={() => setShowChangePassword(false)}>
                <FaTimes />
              </button>
            </div>
            <form onSubmit={handleChangePassword}>
              <div className="form-group">
                <label>Current Password</label>
                <input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="Enter current password"
                  required
                  autoFocus
                />
              </div>
              <div className="form-group">
                <label>New Password</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Enter new password (min 6 characters)"
                  required
                  minLength="6"
                />
              </div>
              <div className="form-group">
                <label>Confirm New Password</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm new password"
                  required
                  minLength="6"
                />
              </div>
              <div className="modal-actions">
                <button type="button" className="btn-secondary" onClick={() => setShowChangePassword(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  Change Password
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default Sidebar
