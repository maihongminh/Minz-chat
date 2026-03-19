import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore, useChatStore } from '../utils/store'
import { roomsAPI, usersAPI, messagesAPI } from '../services/api'
import { WebSocketService } from '../services/websocket'
import Sidebar from '../components/Sidebar'
import ChatArea from '../components/ChatArea'
import UserList from '../components/UserList'
import '../styles/chat.css'

// Global flag to prevent duplicate initialization
let isInitializing = false
let isInitialized = false

function Chat() {
  const navigate = useNavigate()
  const { token, user, logout } = useAuthStore()
  const { setWs, setRooms, setOnlineUsers, addMessage, updateUserStatus, setMessages, currentRoom, currentPrivateChat, incrementUnreadRoom, incrementUnreadPrivateChat, setTyping, updateMessageReadReceipt, setMessageReadReceipts, updateMessage, deleteMessageLocally, hideMessage } = useChatStore()
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!token) {
      navigate('/login')
      return
    }

    let isSubscribed = true
    
    if (isSubscribed) {
      initializeChat()
    }

    return () => {
      isSubscribed = false
      // Don't reset flags - let them persist to prevent re-initialization
      const ws = useChatStore.getState().ws
      if (ws && !isSubscribed) {
        ws.disconnect()
      }
    }
  }, [token])

  useEffect(() => {
    if (currentRoom) {
      loadRoomMessages(currentRoom.id)
    } else if (currentPrivateChat) {
      loadPrivateMessages(currentPrivateChat.id)
    }
  }, [currentRoom, currentPrivateChat])

  const initializeChat = async () => {
    // Prevent duplicate initialization using global flag
    if (isInitializing || isInitialized) {
      setLoading(false)
      return
    }
    
    isInitializing = true
    
    try {
      // Load rooms and users
      const [roomsRes, usersRes] = await Promise.all([
        roomsAPI.getRooms(),
        usersAPI.getUsers(),
      ])

      setRooms(roomsRes.data)
      setUsers(usersRes.data)

      // Initialize WebSocket
      const wsService = new WebSocketService(token)
      await wsService.connect()
      setWs(wsService)

      // Handle WebSocket messages
      wsService.onMessage((data) => {
        handleWebSocketMessage(data)
      })

      setLoading(false)
      isInitializing = false
      isInitialized = true
    } catch (error) {
      console.error('Failed to initialize chat:', error)
      isInitializing = false
      if (error.response?.status === 401) {
        logout()
        navigate('/login')
      }
    }
  }

  const handleWebSocketMessage = (data) => {
    switch (data.type) {
      case 'chat_message':
        addMessage(data)
        
        // Track unread if message is not in current view AND not sent by me
        if (data.room_id && data.sender_id !== user?.id) {
          // Room message from someone else
          if (!currentRoom || currentRoom.id !== data.room_id) {
            incrementUnreadRoom(data.room_id)
          }
        } else if (data.is_private && data.sender_id !== user.id) {
          // Private message from someone else
          if (!currentPrivateChat || currentPrivateChat.id !== data.sender_id) {
            incrementUnreadPrivateChat(data.sender_id)
          }
        }
        break
      
      case 'online_users':
        setOnlineUsers(data.user_ids)
        break
      
      case 'user_status':
        updateUserStatus(data.user_id, data.is_online)
        break
      
      case 'room_deleted':
        // Room was deleted, refresh room list
        handleRoomDeleted(data.room_id, data.room_name)
        break
      
      case 'typing':
        // Handle typing indicator
        if (data.user_id !== user?.id) {
          setTyping(data.user_id, data.is_typing, data.room_id)
        }
        break
      
      case 'message_read':
        // Handle read receipt
        updateMessageReadReceipt(data.message_id, data.user_id)
        break
      
      case 'message_edited':
        // Handle message edit
        updateMessage(data.message_id, {
          content: data.content,
          is_edited: true
        })
        break
      
      case 'message_deleted':
        // Handle message delete
        if (data.delete_for_everyone) {
          // Delete for everyone - update message content
          updateMessage(data.message_id, {
            content: 'This message was deleted',
            is_deleted: true
          })
        } else {
          // Delete for me only - hide the message
          hideMessage(data.message_id)
        }
        break
      
      default:
        console.log('Unknown message type:', data.type)
    }
  }

  const handleRoomDeleted = async (roomId, roomName) => {
    // Refresh rooms list
    try {
      const roomsRes = await roomsAPI.getRooms()
      setRooms(roomsRes.data)
      
      // If deleted room was current room, clear selection
      if (currentRoom?.id === roomId) {
        useChatStore.getState().setCurrentRoom(null)
      }
    } catch (error) {
      console.error('Failed to refresh rooms after deletion:', error)
    }
  }

  const loadRoomMessages = async (roomId) => {
    try {
      const response = await messagesAPI.getRoomMessages(roomId)
      setMessages(response.data)
      
      // Extract and store read receipts
      const receipts = {}
      response.data.forEach(msg => {
        if (msg.read_by && msg.read_by.length > 0) {
          receipts[msg.id] = msg.read_by
        }
      })
      setMessageReadReceipts(receipts)
    } catch (error) {
      console.error('Failed to load room messages:', error)
    }
  }

  const loadPrivateMessages = async (userId) => {
    try {
      const response = await messagesAPI.getPrivateMessages(userId)
      setMessages(response.data)
      
      // Extract and store read receipts
      const receipts = {}
      response.data.forEach(msg => {
        if (msg.read_by && msg.read_by.length > 0) {
          receipts[msg.id] = msg.read_by
        }
      })
      setMessageReadReceipts(receipts)
    } catch (error) {
      console.error('Failed to load private messages:', error)
    }
  }

  const handleLogout = () => {
    const ws = useChatStore.getState().ws
    if (ws) {
      ws.disconnect()
    }
    logout()
    navigate('/login')
  }

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="spinner"></div>
        <p>Loading chat...</p>
      </div>
    )
  }

  return (
    <div className="chat-container">
      <Sidebar onLogout={handleLogout} />
      <ChatArea />
      <UserList users={users} />
    </div>
  )
}

export default Chat
