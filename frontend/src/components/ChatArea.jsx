import React, { useState, useEffect, useRef } from 'react'
import { FaHashtag, FaUserCircle, FaPaperPlane } from 'react-icons/fa'
import { useChatStore, useAuthStore } from '../utils/store'
import { format } from 'date-fns'
import '../styles/chatarea.css'

function ChatArea() {
  const { user } = useAuthStore()
  const { currentRoom, currentPrivateChat, messages, ws, clearUnreadRoom, clearUnreadPrivateChat, typingUsers, messageReadReceipts } = useChatStore()
  const [messageInput, setMessageInput] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const messagesEndRef = useRef(null)
  const typingTimeoutRef = useRef(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  // Filter messages for current context
  const filteredMessages = messages.filter((msg) => {
    if (currentRoom) {
      return msg.room_id === currentRoom.id
    } else if (currentPrivateChat) {
      return msg.is_private && (
        (msg.sender_id === user.id && msg.receiver_id === currentPrivateChat.id) ||
        (msg.sender_id === currentPrivateChat.id && msg.receiver_id === user.id)
      )
    }
    return false
  })

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  // Mark messages as read when viewing
  useEffect(() => {
    if (!ws || !user) return
    
    const unreadMessageIds = filteredMessages
      .filter(msg => msg.sender_id !== user.id)
      .filter(msg => {
        const readBy = messageReadReceipts[msg.id] || []
        return !readBy.includes(user.id)
      })
      .map(msg => msg.id)
    
    if (unreadMessageIds.length > 0) {
      // Delay marking as read to simulate "viewing"
      const timeout = setTimeout(() => {
        ws.markAsRead(unreadMessageIds)
      }, 500)
      
      return () => clearTimeout(timeout)
    }
  }, [filteredMessages, ws, user, messageReadReceipts])

  const handleClearUnread = () => {
    // Clear badge when user interacts with chat area
    if (currentRoom) {
      clearUnreadRoom(currentRoom.id)
    } else if (currentPrivateChat) {
      clearUnreadPrivateChat(currentPrivateChat.id)
    }
  }

  const handleInputChange = (e) => {
    setMessageInput(e.target.value)
    
    // Send typing indicator
    if (!ws) return
    
    if (!isTyping) {
      setIsTyping(true)
      if (currentRoom) {
        ws.sendTyping(true, currentRoom.id, null)
      } else if (currentPrivateChat) {
        ws.sendTyping(true, null, currentPrivateChat.id)
      }
    }
    
    // Clear previous timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current)
    }
    
    // Set timeout to stop typing
    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false)
      if (currentRoom) {
        ws.sendTyping(false, currentRoom.id, null)
      } else if (currentPrivateChat) {
        ws.sendTyping(false, null, currentPrivateChat.id)
      }
    }, 2000)
  }

  const handleSendMessage = (e) => {
    e.preventDefault()
    
    if (!messageInput.trim() || !ws) return
    
    // Stop typing indicator
    if (isTyping) {
      setIsTyping(false)
      if (currentRoom) {
        ws.sendTyping(false, currentRoom.id, null)
      } else if (currentPrivateChat) {
        ws.sendTyping(false, null, currentPrivateChat.id)
      }
    }
    
    // Clear typing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current)
    }
    
    // Clear badge when sending message
    handleClearUnread()
    
    if (currentRoom) {
      ws.sendMessage(messageInput, currentRoom.id, null)
    } else if (currentPrivateChat) {
      ws.sendMessage(messageInput, null, currentPrivateChat.id)
    }

    setMessageInput('')
  }

  const formatTime = (timestamp) => {
    try {
      const date = new Date(timestamp)
      const today = new Date()
      const isToday = date.toDateString() === today.toDateString()
      
      if (isToday) {
        return format(date, 'h:mm a')
      } else {
        return format(date, 'MMM d, h:mm a')
      }
    } catch {
      return ''
    }
  }

  // Get typing users for current context
  const getTypingIndicator = () => {
    const key = currentRoom ? `room_${currentRoom.id}` : currentPrivateChat ? `user_${currentPrivateChat.id}` : null
    if (key && typingUsers[key]) {
      const typingUserId = typingUsers[key]
      if (currentRoom) {
        // In a room, show username
        const typingMsg = filteredMessages.find(m => m.sender_id === typingUserId)
        const username = typingMsg?.sender_username || 'Someone'
        return `${username} is typing...`
      } else {
        // In private chat
        return `${currentPrivateChat.username} is typing...`
      }
    }
    return null
  }

  if (!currentRoom && !currentPrivateChat) {
    return (
      <div className="chat-area">
        <div className="empty-state">
          <h2>Welcome to HiHi Chat!</h2>
          <p>Select a channel or user to start chatting</p>
        </div>
      </div>
    )
  }

  return (
    <div className="chat-area">
      <div className="chat-header">
        {currentRoom ? (
          <>
            <FaHashtag className="header-icon" />
            <div className="header-info">
              <h3>{currentRoom.name}</h3>
              {currentRoom.description && (
                <p className="header-desc">{currentRoom.description}</p>
              )}
            </div>
          </>
        ) : (
          <>
            {currentPrivateChat?.avatar_url ? (
              <img src={currentPrivateChat.avatar_url} alt="" className="header-avatar" />
            ) : (
              <FaUserCircle className="header-icon" />
            )}
            <h3>{currentPrivateChat?.username}</h3>
          </>
        )}
      </div>

      <div className="messages-container" onClick={handleClearUnread}>
        <div className="messages-list">
          {filteredMessages.length === 0 ? (
            <div className="no-messages">
              {currentRoom ? (
                <>
                  <FaHashtag className="empty-icon" />
                  <h3>Welcome to #{currentRoom.name}!</h3>
                  <p>This is the start of the #{currentRoom.name} channel.</p>
                </>
              ) : (
                <>
                  <FaUserCircle className="empty-icon" />
                  <h3>Start a conversation!</h3>
                  <p>This is the beginning of your direct message history with @{currentPrivateChat?.username}.</p>
                </>
              )}
            </div>
          ) : (
            filteredMessages.map((msg, index) => {
              const showAvatar = index === 0 || filteredMessages[index - 1].sender_id !== msg.sender_id
              const isCurrentUser = msg.sender_id === user.id

              return (
                <div key={msg.id} className={`message ${showAvatar ? 'with-avatar' : ''} ${isCurrentUser ? 'own-message' : 'other-message'}`}>
                  {showAvatar ? (
                    <div className="message-header">
                      {!isCurrentUser && (
                        msg.sender_avatar ? (
                          <img src={msg.sender_avatar} alt="" className="message-avatar" />
                        ) : (
                          <FaUserCircle className="message-avatar-default" />
                        )
                      )}
                      <div className="message-content">
                        <div className="message-meta">
                          <span className={`message-author ${isCurrentUser ? 'current-user' : ''}`}>
                            {msg.sender_username}
                          </span>
                          <span className="message-time">{formatTime(msg.created_at)}</span>
                        </div>
                        <div className="message-text">
                          {msg.content}
                          {isCurrentUser && (
                            <span className="read-receipt">
                              {(() => {
                                const readBy = messageReadReceipts[msg.id] || []
                                const readCount = readBy.filter(id => id !== user.id).length
                                if (readCount > 0) {
                                  return <span className="seen-indicator"> ✓✓ Seen</span>
                                }
                                return <span className="sent-indicator"> ✓</span>
                              })()}
                            </span>
                          )}
                        </div>
                      </div>
                      {isCurrentUser && (
                        msg.sender_avatar ? (
                          <img src={msg.sender_avatar} alt="" className="message-avatar" />
                        ) : (
                          <FaUserCircle className="message-avatar-default" />
                        )
                      )}
                    </div>
                  ) : (
                    <div className="message-compact">
                      <span className="message-time-compact">{formatTime(msg.created_at)}</span>
                      <div className="message-text">
                        {msg.content}
                        {isCurrentUser && (
                          <span className="read-receipt">
                            {(() => {
                              const readBy = messageReadReceipts[msg.id] || []
                              const readCount = readBy.filter(id => id !== user.id).length
                              if (readCount > 0) {
                                return <span className="seen-indicator"> ✓✓</span>
                              }
                              return <span className="sent-indicator"> ✓</span>
                            })()}
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )
            })
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {getTypingIndicator() && (
        <div className="typing-indicator">
          <span className="typing-text">{getTypingIndicator()}</span>
        </div>
      )}

      <div className="message-input-container">
        <form onSubmit={handleSendMessage} className="message-input-form">
          <input
            type="text"
            className="message-input"
            placeholder={
              currentRoom 
                ? `Message #${currentRoom.name}` 
                : `Message @${currentPrivateChat?.username}`
            }
            value={messageInput}
            onChange={handleInputChange}
            onFocus={handleClearUnread}
          />
          <button 
            type="submit" 
            className="send-button"
            disabled={!messageInput.trim()}
            title="Send message"
          >
            <FaPaperPlane />
          </button>
        </form>
      </div>
    </div>
  )
}

export default ChatArea
