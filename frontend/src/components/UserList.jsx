import React from 'react'
import { FaUserCircle, FaCircle } from 'react-icons/fa'
import { useChatStore, useAuthStore } from '../utils/store'
import '../styles/userlist.css'

function UserList({ users }) {
  const { user: currentUser } = useAuthStore()
  const { onlineUsers, currentPrivateChat, setCurrentPrivateChat, ws, setMessages, unreadPrivateChats } = useChatStore()

  const handleUserClick = async (user) => {
    // Only clear messages if switching to a different user
    if (currentPrivateChat?.id !== user.id) {
      setMessages([])
    }
    setCurrentPrivateChat(user)
    
    // Load private messages will be handled by Chat.jsx useEffect
  }

  const sortedUsers = [...users].sort((a, b) => {
    const aOnline = onlineUsers.includes(a.id)
    const bOnline = onlineUsers.includes(b.id)
    
    if (aOnline && !bOnline) return -1
    if (!aOnline && bOnline) return 1
    return a.username.localeCompare(b.username)
  })

  const onlineCount = sortedUsers.filter(u => onlineUsers.includes(u.id)).length
  const offlineCount = sortedUsers.length - onlineCount

  return (
    <div className="user-list">
      <div className="user-list-header">
        <h3>Members</h3>
      </div>

      <div className="user-list-content">
        {onlineCount > 0 && (
          <div className="user-section">
            <div className="section-title">ONLINE — {onlineCount}</div>
            {sortedUsers
              .filter(u => onlineUsers.includes(u.id))
              .map(user => {
                const unreadCount = unreadPrivateChats[user.id] || 0
                const hasUnread = unreadCount > 0
                
                return (
                  <div
                    key={user.id}
                    className={`user-item ${currentPrivateChat?.id === user.id ? 'active' : ''} ${user.id === currentUser?.id ? 'current' : ''} ${hasUnread ? 'has-unread' : ''}`}
                    onClick={() => user.id !== currentUser?.id && handleUserClick(user)}
                  >
                    <div className="user-avatar-container">
                      {user.avatar_url ? (
                        <img src={user.avatar_url} alt="" className="user-avatar-small" />
                      ) : (
                        <FaUserCircle className="user-avatar-default-small" />
                      )}
                      <FaCircle className="status-indicator online" />
                    </div>
                    <div className="user-name">
                      {user.username}
                      {user.id === currentUser?.id && <span className="you-badge"> (You)</span>}
                    </div>
                    {hasUnread && user.id !== currentUser?.id && (
                      <span className="unread-badge">{unreadCount}</span>
                    )}
                  </div>
                )
              })}
          </div>
        )}

        {offlineCount > 0 && (
          <div className="user-section">
            <div className="section-title">OFFLINE — {offlineCount}</div>
            {sortedUsers
              .filter(u => !onlineUsers.includes(u.id))
              .map(user => {
                const unreadCount = unreadPrivateChats[user.id] || 0
                const hasUnread = unreadCount > 0
                
                return (
                  <div
                    key={user.id}
                    className={`user-item ${currentPrivateChat?.id === user.id ? 'active' : ''} ${hasUnread ? 'has-unread' : ''}`}
                    onClick={() => handleUserClick(user)}
                  >
                    <div className="user-avatar-container">
                      {user.avatar_url ? (
                        <img src={user.avatar_url} alt="" className="user-avatar-small" />
                      ) : (
                        <FaUserCircle className="user-avatar-default-small" />
                      )}
                      <FaCircle className="status-indicator offline" />
                    </div>
                    <div className="user-name">{user.username}</div>
                    {hasUnread && (
                      <span className="unread-badge">{unreadCount}</span>
                    )}
                  </div>
                )
              })}
          </div>
        )}
      </div>
    </div>
  )
}

export default UserList
