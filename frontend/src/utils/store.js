import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export const useAuthStore = create(
  persist(
    (set) => ({
      token: null,
      user: null,
      setAuth: (token, user) => set({ token, user }),
      logout: () => set({ token: null, user: null }),
    }),
    {
      name: 'auth-storage',
    }
  )
)

export const useChatStore = create((set) => ({
  ws: null,
  messages: [],
  rooms: [],
  currentRoom: null,
  currentPrivateChat: null,
  onlineUsers: [],
  typingUsers: {},
  messageReadReceipts: {}, // { messageId: [userId1, userId2, ...] }
  unreadRooms: {}, // { roomId: count }
  unreadPrivateChats: {}, // { userId: count }
  
  setWs: (ws) => set({ ws }),
  addMessage: (message) => set((state) => ({ 
    messages: [...state.messages, message] 
  })),
  setMessages: (messages) => set({ messages }),
  setRooms: (rooms) => set({ rooms }),
  setCurrentRoom: (room) => set((state) => {
    // Clear unread for this room
    const unreadRooms = { ...state.unreadRooms }
    if (room) {
      delete unreadRooms[room.id]
    }
    return { currentRoom: room, currentPrivateChat: null, unreadRooms }
  }),
  setCurrentPrivateChat: (user) => set((state) => {
    // Clear unread for this user
    const unreadPrivateChats = { ...state.unreadPrivateChats }
    if (user) {
      delete unreadPrivateChats[user.id]
    }
    return { currentPrivateChat: user, currentRoom: null, unreadPrivateChats }
  }),
  setOnlineUsers: (users) => set({ onlineUsers: users }),
  updateUserStatus: (userId, isOnline) => set((state) => {
    const onlineUsers = isOnline 
      ? [...new Set([...state.onlineUsers, userId])]
      : state.onlineUsers.filter(id => id !== userId)
    return { onlineUsers }
  }),
  setTyping: (userId, isTyping, roomId) => set((state) => {
    const key = roomId ? `room_${roomId}` : `user_${userId}`
    const typingUsers = { ...state.typingUsers }
    if (isTyping) {
      typingUsers[key] = userId
    } else {
      delete typingUsers[key]
    }
    return { typingUsers }
  }),
  incrementUnreadRoom: (roomId) => set((state) => {
    const unreadRooms = { ...state.unreadRooms }
    unreadRooms[roomId] = (unreadRooms[roomId] || 0) + 1
    return { unreadRooms }
  }),
  incrementUnreadPrivateChat: (userId) => set((state) => {
    const unreadPrivateChats = { ...state.unreadPrivateChats }
    unreadPrivateChats[userId] = (unreadPrivateChats[userId] || 0) + 1
    return { unreadPrivateChats }
  }),
  clearUnreadRoom: (roomId) => set((state) => {
    const unreadRooms = { ...state.unreadRooms }
    delete unreadRooms[roomId]
    return { unreadRooms }
  }),
  clearUnreadPrivateChat: (userId) => set((state) => {
    const unreadPrivateChats = { ...state.unreadPrivateChats }
    delete unreadPrivateChats[userId]
    return { unreadPrivateChats }
  }),
  updateMessageReadReceipt: (messageId, userId) => set((state) => {
    const messageReadReceipts = { ...state.messageReadReceipts }
    if (!messageReadReceipts[messageId]) {
      messageReadReceipts[messageId] = []
    }
    if (!messageReadReceipts[messageId].includes(userId)) {
      messageReadReceipts[messageId] = [...messageReadReceipts[messageId], userId]
    }
    return { messageReadReceipts }
  }),
  setMessageReadReceipts: (receipts) => set({ messageReadReceipts: receipts }),
  updateMessage: (messageId, updates) => set((state) => ({
    messages: state.messages.map(msg => 
      msg.id === messageId ? { ...msg, ...updates } : msg
    )
  })),
  deleteMessageLocally: (messageId) => set((state) => ({
    messages: state.messages.filter(msg => msg.id !== messageId)
  })),
  hideMessage: (messageId) => set((state) => ({
    messages: state.messages.map(msg =>
      msg.id === messageId ? { ...msg, hidden: true } : msg
    )
  })),
}))
