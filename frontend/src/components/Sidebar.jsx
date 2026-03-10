import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { FaHashtag, FaPlus, FaSignOutAlt, FaUserCircle, FaUserShield, FaTimes } from 'react-icons/fa'
import { useChatStore, useAuthStore } from '../utils/store'
import { roomsAPI } from '../services/api'
import '../styles/sidebar.css'

function Sidebar({ onLogout }) {
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const { rooms, currentRoom, setCurrentRoom, setRooms, ws, unreadRooms } = useChatStore()
  const [showCreateRoom, setShowCreateRoom] = useState(false)
  const [newRoomName, setNewRoomName] = useState('')
  const [newRoomDesc, setNewRoomDesc] = useState('')

  const isAdmin = user?.role === 'admin' || user?.role === 'super_admin'

  const handleCreateRoom = async (e) => {
    e.preventDefault()
    if (!newRoomName.trim()) return

    try {
      const response = await roomsAPI.createRoom({
        name: newRoomName,
        description: newRoomDesc,
        is_private: false
      })

      const roomsRes = await roomsAPI.getRooms()
      setRooms(roomsRes.data)
      
      setNewRoomName('')
      setNewRoomDesc('')
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
    setCurrentRoom(room)
    if (ws) {
      ws.joinRoom(room.id)
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
            
            return (
              <div
                key={room.id}
                className={`channel-item ${currentRoom?.id === room.id ? 'active' : ''} ${hasUnread ? 'has-unread' : ''}`}
                onClick={() => handleRoomClick(room)}
              >
                <FaHashtag className="channel-icon" />
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
    </div>
  )
}

export default Sidebar
