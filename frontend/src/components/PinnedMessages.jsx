import React, { useState, useEffect } from 'react'
import '../styles/pinnedmessages.css'

const PinnedMessages = ({ pinnedMessages, onScrollToMessage, onUnpin, currentUserId }) => {
  const [isExpanded, setIsExpanded] = useState(false)
  const [showDropdown, setShowDropdown] = useState(false)

  // Auto-collapse when no pinned messages
  useEffect(() => {
    if (pinnedMessages.length === 0) {
      setIsExpanded(false)
      setShowDropdown(false)
    }
  }, [pinnedMessages.length])

  if (!pinnedMessages || pinnedMessages.length === 0) {
    return null
  }

  const handleToggle = () => {
    if (pinnedMessages.length > 1) {
      setShowDropdown(!showDropdown)
    }
  }

  const handleMessageClick = (messageId) => {
    setShowDropdown(false)
    if (onScrollToMessage) {
      onScrollToMessage(messageId)
    }
  }

  const handleUnpin = (e, messageId) => {
    e.stopPropagation()
    if (onUnpin) {
      onUnpin(messageId)
    }
  }

  const formatTime = (timestamp) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diff = now - date
    const days = Math.floor(diff / (1000 * 60 * 60 * 24))
    
    if (days === 0) {
      return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
    } else if (days === 1) {
      return 'Yesterday'
    } else if (days < 7) {
      return `${days} days ago`
    } else {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    }
  }

  const truncateText = (text, maxLength = 80) => {
    if (text.length <= maxLength) return text
    return text.substring(0, maxLength) + '...'
  }

  // Show first message
  const firstMessage = pinnedMessages[0]
  const hasMultiple = pinnedMessages.length > 1

  return (
    <div className="pinned-messages-banner">
      <div className="pinned-banner-header" onClick={handleToggle}>
        <div className="pinned-icon">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
            <path d="M9.5 1.5L6 5H3v3l3 3v3.5l2-2V9l3-3h3.5V3.5l-2 2L9.5 1.5z" />
          </svg>
        </div>
        <div className="pinned-content">
          <div className="pinned-label">
            {hasMultiple ? `${pinnedMessages.length} Pinned Messages` : 'Pinned Message'}
          </div>
          <div className="pinned-message-preview" onClick={() => handleMessageClick(firstMessage.id)}>
            <span className="pinned-sender">{firstMessage.sender_username}:</span>
            <span className="pinned-text">{truncateText(firstMessage.content)}</span>
            <span className="pinned-time">{formatTime(firstMessage.created_at)}</span>
          </div>
          {firstMessage.pinned_by_username && (
            <div className="pinned-by">
              Pinned by {firstMessage.pinned_by_username}
            </div>
          )}
        </div>
        {hasMultiple && (
          <div className="pinned-toggle">
            <svg
              width="16"
              height="16"
              viewBox="0 0 16 16"
              fill="currentColor"
              className={showDropdown ? 'rotated' : ''}
            >
              <path d="M4 6l4 4 4-4H4z" />
            </svg>
          </div>
        )}
        <button
          className="pinned-close"
          onClick={(e) => handleUnpin(e, firstMessage.id)}
          title="Unpin message"
        >
          ×
        </button>
      </div>

      {showDropdown && hasMultiple && (
        <div className="pinned-dropdown">
          {pinnedMessages.slice(1).map((msg) => (
            <div
              key={msg.id}
              className="pinned-dropdown-item"
              onClick={() => handleMessageClick(msg.id)}
            >
              <div className="pinned-message-content">
                <div className="pinned-message-header">
                  <span className="pinned-sender">{msg.sender_username}</span>
                  <span className="pinned-time">{formatTime(msg.created_at)}</span>
                </div>
                <div className="pinned-message-text">{truncateText(msg.content)}</div>
                {msg.pinned_by_username && (
                  <div className="pinned-by-small">Pinned by {msg.pinned_by_username}</div>
                )}
              </div>
              <button
                className="pinned-unpin-btn"
                onClick={(e) => handleUnpin(e, msg.id)}
                title="Unpin message"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default PinnedMessages
