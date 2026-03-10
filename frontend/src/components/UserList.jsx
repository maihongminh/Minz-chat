import React from 'react'
import { FaUserCircle, FaCircle } from 'react-icons/fa'
import { useChatStore, useAuthStore } from '../utils/store'
import '../styles/userlist.css'

function UserList({ users }) {
  const { user: currentUser } = useAuthStore()
  const { onlineUsers, currentPrivateChat, setCurrentPrivateChat, ws, setMessages } = useChatStore()

  const handleUserClick = async (user) => {
    setCurrentPrivateChat(user)
    setMessages([])
    
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
              .map(user => (
                <div
                  key={user.id}
                  className={`user-item ${currentPrivateChat?.id === user.id ? 'active' : ''} ${user.id === currentUser?.id ? 'current' : ''}`}
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
                </div>
              ))}
          </div>
        )}

        {offlineCount > 0 && (
          <div className="user-section">
            <div className="section-title">OFFLINE — {offlineCount}</div>
            {sortedUsers
              .filter(u => !onlineUsers.includes(u.id))
              .map(user => (
                <div
                  key={user.id}
                  className={`user-item ${currentPrivateChat?.id === user.id ? 'active' : ''}`}
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
                </div>
              ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default UserList
