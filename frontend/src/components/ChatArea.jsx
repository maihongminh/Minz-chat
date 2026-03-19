import React, { useState, useEffect, useRef } from 'react'
import { FaHashtag, FaUserCircle, FaPaperPlane, FaPaperclip, FaTimes, FaFile, FaImage, FaEllipsisV, FaEdit, FaTrash, FaCheck } from 'react-icons/fa'
import { useChatStore, useAuthStore } from '../utils/store'
import { format } from 'date-fns'
import '../styles/chatarea.css'

function ChatArea() {
  const { user } = useAuthStore()
  const { currentRoom, currentPrivateChat, messages, ws, clearUnreadRoom, clearUnreadPrivateChat, typingUsers, messageReadReceipts } = useChatStore()
  const [messageInput, setMessageInput] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [selectedFile, setSelectedFile] = useState(null)
  const [filePreview, setFilePreview] = useState(null)
  const [selectedFiles, setSelectedFiles] = useState([])
  const [filePreviews, setFilePreviews] = useState([])
  const [editingMessageId, setEditingMessageId] = useState(null)
  const [activeMenuMessageId, setActiveMenuMessageId] = useState(null)
  const [deleteConfirmMessageId, setDeleteConfirmMessageId] = useState(null)
  const messagesEndRef = useRef(null)
  const typingTimeoutRef = useRef(null)
  const textareaRef = useRef(null)
  const fileInputRef = useRef(null)
  const menuRef = useRef(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  // Filter messages for current context and exclude hidden messages
  const filteredMessages = messages.filter((msg) => {
    // Skip hidden messages (deleted for me only)
    if (msg.hidden) return false
    
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

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setActiveMenuMessageId(null)
      }
    }
    
    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

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
    
    // Auto-resize textarea
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px'
    }
    
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

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files)
    if (files.length === 0) return
    
    // Validate total files (max 5 files)
    if (files.length > 5) {
      alert('You can only upload up to 5 files at once')
      return
    }
    
    // Validate each file size (max 5MB per file)
    const oversizedFiles = files.filter(file => file.size > 5 * 1024 * 1024)
    if (oversizedFiles.length > 0) {
      alert('Each file size must be less than 5MB')
      return
    }
    
    setSelectedFiles(files)
    
    // Create previews for images
    const previews = []
    let loadedCount = 0
    
    files.forEach((file, index) => {
      if (file.type.startsWith('image/')) {
        const reader = new FileReader()
        reader.onloadend = () => {
          previews[index] = { type: 'image', url: reader.result, file }
          loadedCount++
          if (loadedCount === files.length) {
            setFilePreviews([...previews])
          }
        }
        reader.readAsDataURL(file)
      } else {
        previews[index] = { type: 'file', file }
        loadedCount++
        if (loadedCount === files.length) {
          setFilePreviews([...previews])
        }
      }
    })
  }
  
  const handleRemoveFile = (index = null) => {
    if (index !== null) {
      // Remove specific file from multiple files
      const newFiles = selectedFiles.filter((_, i) => i !== index)
      const newPreviews = filePreviews.filter((_, i) => i !== index)
      setSelectedFiles(newFiles)
      setFilePreviews(newPreviews)
      
      if (newFiles.length === 0 && fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    } else {
      // Remove all files
      setSelectedFile(null)
      setFilePreview(null)
      setSelectedFiles([])
      setFilePreviews([])
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  const handleSendMessage = (e) => {
    e.preventDefault()
    
    // If in editing mode
    if (editingMessageId) {
      // If input is empty, cancel edit
      if (!messageInput.trim()) {
        handleCancelEdit()
        return
      }
      
      // Send edit message
      if (ws) {
        ws.editMessage(editingMessageId, messageInput)
      }
      
      // Reset editing state
      setEditingMessageId(null)
      setMessageInput('')
      
      // Reset textarea height
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto'
      }
      
      return
    }
    
    // Normal send message flow
    if (!messageInput.trim() && !selectedFile && selectedFiles.length === 0) return
    if (!ws) return
    
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
    
    // Handle multiple files
    if (selectedFiles.length > 0) {
      const attachmentsPromises = selectedFiles.map(file => {
        return new Promise((resolve) => {
          const reader = new FileReader()
          reader.onloadend = () => {
            resolve({
              file_url: reader.result,
              file_name: file.name,
              file_type: file.type,
              file_size: file.size
            })
          }
          reader.readAsDataURL(file)
        })
      })
      
      Promise.all(attachmentsPromises).then(attachments => {
        if (currentRoom) {
          ws.sendMessage(messageInput || '', currentRoom.id, null, null, null, null, attachments)
        } else if (currentPrivateChat) {
          ws.sendMessage(messageInput || '', null, currentPrivateChat.id, null, null, null, attachments)
        }
      })
    } else if (selectedFile) {
      // Legacy single file support
      const reader = new FileReader()
      reader.onloadend = () => {
        const fileUrl = reader.result // base64 encoded
        
        if (currentRoom) {
          ws.sendMessage(messageInput || '', currentRoom.id, null, fileUrl, selectedFile.name, selectedFile.type)
        } else if (currentPrivateChat) {
          ws.sendMessage(messageInput || '', null, currentPrivateChat.id, fileUrl, selectedFile.name, selectedFile.type)
        }
      }
      reader.readAsDataURL(selectedFile)
    } else {
      // No file, just send text message
      if (currentRoom) {
        ws.sendMessage(messageInput, currentRoom.id, null)
      } else if (currentPrivateChat) {
        ws.sendMessage(messageInput, null, currentPrivateChat.id)
      }
    }

    setMessageInput('')
    setSelectedFile(null)
    setFilePreview(null)
    setSelectedFiles([])
    setFilePreviews([])
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
    
    // Reset textarea height after sending
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
    }
  }

  const handlePaste = (e) => {
    // Get clipboard data
    const items = e.clipboardData?.items
    if (!items) return
    
    // Find image items in clipboard
    const imageItems = []
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.startsWith('image/')) {
        imageItems.push(items[i])
      }
    }
    
    if (imageItems.length === 0) return
    
    // Prevent default paste behavior for images
    e.preventDefault()
    
    // Convert clipboard images to File objects
    const newFiles = []
    imageItems.forEach((item, index) => {
      const blob = item.getAsFile()
      if (blob) {
        // Create a proper File object with a generated name
        const timestamp = Date.now()
        const fileName = `pasted-image-${timestamp}-${index}.png`
        const file = new File([blob], fileName, { type: blob.type })
        newFiles.push(file)
      }
    })
    
    if (newFiles.length === 0) return
    
    // Merge with existing selected files
    const allFiles = [...selectedFiles, ...newFiles]
    
    // Validate total files (max 5)
    if (allFiles.length > 5) {
      alert('You can only upload up to 5 files at once')
      return
    }
    
    // Validate file sizes (max 5MB per file)
    const oversizedFiles = allFiles.filter(file => file.size > 5 * 1024 * 1024)
    if (oversizedFiles.length > 0) {
      alert('Each file size must be less than 5MB')
      return
    }
    
    setSelectedFiles(allFiles)
    
    // Create previews for all files
    const previews = [...filePreviews]
    let loadedCount = 0
    
    newFiles.forEach((file, index) => {
      const reader = new FileReader()
      reader.onloadend = () => {
        previews.push({ type: 'image', url: reader.result, file })
        loadedCount++
        if (loadedCount === newFiles.length) {
          setFilePreviews([...previews])
        }
      }
      reader.readAsDataURL(file)
    })
  }

  const handleKeyDown = (e) => {
    // Cancel edit on Escape
    if (e.key === 'Escape' && editingMessageId) {
      e.preventDefault()
      handleCancelEdit()
      return
    }
    
    // Send message on Enter (without Shift)
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage(e)
    }
    // Allow Shift + Enter to create new line (default textarea behavior)
  }

  const formatTime = (timestamp) => {
    try {
      // Backend returns UTC timestamp without 'Z', so we need to append it
      // to ensure correct parsing as UTC
      let dateString = timestamp
      if (typeof timestamp === 'string' && !timestamp.endsWith('Z') && !timestamp.includes('+')) {
        dateString = timestamp + 'Z'
      }
      
      const date = new Date(dateString)
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

  const handleEditMessage = (msg) => {
    setEditingMessageId(msg.id)
    setMessageInput(msg.content)
    setActiveMenuMessageId(null)
    
    // Focus on input box
    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.focus()
      }
    }, 100)
  }

  const handleCancelEdit = () => {
    setEditingMessageId(null)
    setMessageInput('')
  }

  const showDeleteConfirmation = (messageId) => {
    setDeleteConfirmMessageId(messageId)
    setActiveMenuMessageId(null)
  }

  const handleDeleteMessage = (messageId, deleteForEveryone) => {
    if (!ws) return
    
    ws.deleteMessage(messageId, deleteForEveryone)
    setDeleteConfirmMessageId(null)
  }

  const toggleMessageMenu = (messageId) => {
    setActiveMenuMessageId(activeMenuMessageId === messageId ? null : messageId)
  }

  // Helper to render message text content
  const renderMessageContent = (msg) => {
    const isCurrentUser = msg.sender_id === user.id
    const isDeleted = msg.is_deleted

    if (isDeleted) {
      return (
        <div className="message-text deleted-message">
          <em>{msg.content}</em>
        </div>
      )
    }

    return (
      <div className="message-text-container">
        <div className="message-text">
          {msg.content}
          {msg.is_edited && <span className="edited-indicator"> (edited)</span>}
        </div>
        {isCurrentUser && (
          <div className="message-actions-wrapper">
            <button 
              className="message-menu-toggle-btn" 
              onClick={(e) => {
                e.stopPropagation()
                toggleMessageMenu(msg.id)
              }}
              title="Message options"
            >
              <FaEllipsisV />
            </button>
            {activeMenuMessageId === msg.id && (
              <div className="message-actions-popup" ref={menuRef}>
                <button 
                  className="message-action-btn" 
                  onClick={() => handleEditMessage(msg)}
                  title="Edit message"
                >
                  <FaEdit />
                </button>
                <button 
                  className="message-action-btn" 
                  onClick={() => showDeleteConfirmation(msg.id)}
                  title="Delete message"
                >
                  <FaTrash />
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    )
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
              // Show avatar for first message, different sender, or if message has file attachment
              const showAvatar = index === 0 || 
                                 filteredMessages[index - 1].sender_id !== msg.sender_id ||
                                 !!msg.file_url
              const isCurrentUser = msg.sender_id === user.id
              
              // Check if this is the last message from current user in a group
              const isLastInGroup = index === filteredMessages.length - 1 || 
                                    filteredMessages[index + 1].sender_id !== msg.sender_id
              
              // For current user's messages, determine if we should show seen/sent indicator
              let showSeenIndicator = false
              let seenStatus = null
              
              if (isCurrentUser) {
                const readBy = messageReadReceipts[msg.id] || []
                const isRead = readBy.filter(id => id !== user.id).length > 0
                
                if (isLastInGroup) {
                  // Always show indicator for last message in group
                  showSeenIndicator = true
                  seenStatus = isRead ? 'seen' : 'sent'
                } else {
                  // Check if next message has different read status
                  const nextMsg = filteredMessages[index + 1]
                  if (nextMsg && nextMsg.sender_id === user.id) {
                    const nextReadBy = messageReadReceipts[nextMsg.id] || []
                    const nextIsRead = nextReadBy.filter(id => id !== user.id).length > 0
                    
                    // Show indicator if current is read but next is not
                    if (isRead && !nextIsRead) {
                      showSeenIndicator = true
                      seenStatus = 'seen'
                    }
                  }
                }
              }

              return (
                <React.Fragment key={msg.id}>
                  <div className={`message ${showAvatar ? 'with-avatar' : ''} ${isCurrentUser ? 'own-message' : 'other-message'}`}>
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
                          </div>
                          <div className="message-body-wrapper">
                            {msg.attachments && msg.attachments.length > 0 ? (
                              // Message with multiple attachments
                              <div className="message-with-attachment">
                                {msg.content && (
                                  <div className="attachment-text">
                                    {msg.content}
                                  </div>
                                )}
                                <div className="message-attachments-grid">
                                  {msg.attachments.map((att) => (
                                    <div key={att.id} className="message-attachment">
                                      {att.file_type?.startsWith('image/') ? (
                                        <img 
                                          src={att.file_url} 
                                          alt={att.file_name} 
                                          className="message-image"
                                          onClick={() => window.open(att.file_url, '_blank')}
                                        />
                                      ) : (
                                        <a 
                                          href={att.file_url} 
                                          download={att.file_name}
                                          className="message-file"
                                        >
                                          <FaFile className="file-icon" />
                                          <span>{att.file_name}</span>
                                        </a>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            ) : msg.file_url ? (
                              // Legacy single file attachment
                              <div className="message-with-attachment">
                                {msg.content && (
                                  <div className="attachment-text">
                                    {msg.content}
                                  </div>
                                )}
                                <div className="message-attachment">
                                  {msg.file_type?.startsWith('image/') ? (
                                    <img 
                                      src={msg.file_url} 
                                      alt={msg.file_name} 
                                      className="message-image"
                                      onClick={() => window.open(msg.file_url, '_blank')}
                                    />
                                  ) : (
                                    <a 
                                      href={msg.file_url} 
                                      download={msg.file_name}
                                      className="message-file"
                                    >
                                      <FaFile className="file-icon" />
                                      <span>{msg.file_name}</span>
                                    </a>
                                  )}
                                </div>
                              </div>
                            ) : (
                              // Text-only message
                              msg.content && renderMessageContent(msg)
                            )}
                            <span className="message-time-compact">{formatTime(msg.created_at)}</span>
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
                        {!isCurrentUser && (
                          <>
                            {(msg.attachments && msg.attachments.length > 0) || msg.file_url ? (
                              <div className="message-with-attachment">
                                {msg.content && (
                                  <div className="attachment-text">
                                    {msg.content}
                                  </div>
                                )}
                                {msg.attachments && msg.attachments.length > 0 && (
                                  <div className="message-attachments-grid">
                                    {msg.attachments.map((att) => (
                                      <div key={att.id} className="message-attachment">
                                        {att.file_type?.startsWith('image/') ? (
                                          <img 
                                            src={att.file_url} 
                                            alt={att.file_name} 
                                            className="message-image"
                                            onClick={() => window.open(att.file_url, '_blank')}
                                          />
                                        ) : (
                                          <a 
                                            href={att.file_url} 
                                            download={att.file_name}
                                            className="message-file"
                                          >
                                            <FaFile className="file-icon" />
                                            <span>{att.file_name}</span>
                                          </a>
                                        )}
                                      </div>
                                    ))}
                                  </div>
                                )}
                                {msg.file_url && (
                                  <div className="message-attachment">
                                    {msg.file_type?.startsWith('image/') ? (
                                      <img 
                                        src={msg.file_url} 
                                        alt={msg.file_name} 
                                        className="message-image"
                                        onClick={() => window.open(msg.file_url, '_blank')}
                                      />
                                    ) : (
                                      <a 
                                        href={msg.file_url} 
                                        download={msg.file_name}
                                        className="message-file"
                                      >
                                        <FaFile className="file-icon" />
                                        <span>{msg.file_name}</span>
                                      </a>
                                    )}
                                  </div>
                                )}
                              </div>
                            ) : (
                              msg.content && renderMessageContent(msg)
                            )}
                            <span className="message-time-compact">{formatTime(msg.created_at)}</span>
                          </>
                        )}
                        {isCurrentUser && (
                          <>
                            <span className="message-time-compact">{formatTime(msg.created_at)}</span>
                            {(msg.attachments && msg.attachments.length > 0) || msg.file_url ? (
                              <div className="message-with-attachment">
                                {msg.content && (
                                  <div className="attachment-text">
                                    {msg.content}
                                  </div>
                                )}
                                {msg.attachments && msg.attachments.length > 0 && (
                                  <div className="message-attachments-grid">
                                    {msg.attachments.map((att) => (
                                      <div key={att.id} className="message-attachment">
                                        {att.file_type?.startsWith('image/') ? (
                                          <img 
                                            src={att.file_url} 
                                            alt={att.file_name} 
                                            className="message-image"
                                            onClick={() => window.open(att.file_url, '_blank')}
                                          />
                                        ) : (
                                          <a 
                                            href={att.file_url} 
                                            download={att.file_name}
                                            className="message-file"
                                          >
                                            <FaFile className="file-icon" />
                                            <span>{att.file_name}</span>
                                          </a>
                                        )}
                                      </div>
                                    ))}
                                  </div>
                                )}
                                {msg.file_url && (
                                  <div className="message-attachment">
                                    {msg.file_type?.startsWith('image/') ? (
                                      <img 
                                        src={msg.file_url} 
                                        alt={msg.file_name} 
                                        className="message-image"
                                        onClick={() => window.open(msg.file_url, '_blank')}
                                      />
                                    ) : (
                                      <a 
                                        href={msg.file_url} 
                                        download={msg.file_name}
                                        className="message-file"
                                      >
                                        <FaFile className="file-icon" />
                                        <span>{att.file_name}</span>
                                      </a>
                                    )}
                                  </div>
                                )}
                              </div>
                            ) : (
                              msg.content && renderMessageContent(msg)
                            )}
                          </>
                        )}
                      </div>
                    )}
                  </div>
                  
                  {showSeenIndicator && (
                    <div className={`seen-receipt ${isCurrentUser ? 'own-message' : 'other-message'}`}>
                      {seenStatus === 'seen' ? (
                        <span className="seen-indicator">✓✓ Seen</span>
                      ) : (
                        <span className="sent-indicator">✓ Sent</span>
                      )}
                    </div>
                  )}
                </React.Fragment>
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

      {/* Delete Confirmation Popup */}
      {deleteConfirmMessageId && (
        <div className="delete-confirmation-overlay" onClick={() => setDeleteConfirmMessageId(null)}>
          <div className="delete-confirmation-modal" onClick={(e) => e.stopPropagation()}>
            <h3>Delete Message</h3>
            <p>Choose how you want to delete this message:</p>
            <div className="delete-confirmation-actions">
              <button 
                className="btn-delete-for-me" 
                onClick={() => handleDeleteMessage(deleteConfirmMessageId, false)}
              >
                <FaTrash /> Delete for me
              </button>
              <button 
                className="btn-delete-for-everyone" 
                onClick={() => handleDeleteMessage(deleteConfirmMessageId, true)}
              >
                <FaTrash /> Delete for everyone
              </button>
            </div>
            <button 
              className="btn-cancel-delete" 
              onClick={() => setDeleteConfirmMessageId(null)}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      <div className="message-input-container">
        {editingMessageId && (
          <div className="editing-indicator">
            <span>✏️ Editing message - Press Esc to cancel</span>
            <button type="button" className="cancel-edit-btn" onClick={handleCancelEdit}>
              <FaTimes />
            </button>
          </div>
        )}
        {selectedFiles.length > 0 && (
          <div className="files-preview-container">
            {filePreviews.map((preview, index) => (
              <div key={index} className="file-preview-item">
                {preview.type === 'image' ? (
                  <div className="image-preview-small">
                    <img src={preview.url} alt={preview.file.name} />
                    <button type="button" className="remove-file-btn-small" onClick={() => handleRemoveFile(index)}>
                      <FaTimes />
                    </button>
                    <span className="file-name-small">{preview.file.name}</span>
                  </div>
                ) : (
                  <div className="file-info-small">
                    <FaFile className="file-icon-small" />
                    <span className="file-name-small">{preview.file.name}</span>
                    <button type="button" className="remove-file-btn-small" onClick={() => handleRemoveFile(index)}>
                      <FaTimes />
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
        {selectedFile && (
          <div className="file-preview">
            {filePreview ? (
              <div className="image-preview">
                <img src={filePreview} alt="Preview" />
                <button type="button" className="remove-file-btn" onClick={handleRemoveFile}>
                  <FaTimes />
                </button>
              </div>
            ) : (
              <div className="file-info">
                <FaFile className="file-icon" />
                <span className="file-name">{selectedFile.name}</span>
                <span className="file-size">({(selectedFile.size / 1024).toFixed(1)} KB)</span>
                <button type="button" className="remove-file-btn" onClick={handleRemoveFile}>
                  <FaTimes />
                </button>
              </div>
            )}
          </div>
        )}
        <form onSubmit={handleSendMessage} className="message-input-form">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,.pdf,.doc,.docx,.txt"
            onChange={handleFileSelect}
            multiple
            style={{ display: 'none' }}
          />
          <button
            type="button"
            className="attach-button"
            onClick={() => fileInputRef.current?.click()}
            title="Attach file"
          >
            <FaPaperclip />
          </button>
          <textarea
            ref={textareaRef}
            className="message-input"
            placeholder={
              currentRoom 
                ? `Message #${currentRoom.name}` 
                : `Message @${currentPrivateChat?.username}`
            }
            value={messageInput}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            onPaste={handlePaste}
            onFocus={handleClearUnread}
            rows={1}
          />
          <button 
            type="submit" 
            className="send-button"
            disabled={!messageInput.trim() && !selectedFile && selectedFiles.length === 0}
            title="Send message (Enter)"
          >
            <FaPaperPlane />
          </button>
        </form>
      </div>
    </div>
  )
}

export default ChatArea
