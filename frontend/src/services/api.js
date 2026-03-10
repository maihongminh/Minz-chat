import axios from 'axios'

const API_URL = 'http://localhost:8000/api'

const api = axios.create({
  baseURL: API_URL,
})

// Add token to requests
api.interceptors.request.use((config) => {
  const authStorage = localStorage.getItem('auth-storage')
  
  if (authStorage) {
    try {
      const parsed = JSON.parse(authStorage)
      const token = parsed?.state?.token
      
      if (token) {
        config.headers.Authorization = `Bearer ${token}`
      }
    } catch (e) {
      console.error('Error parsing auth storage:', e)
    }
  }
  
  return config
})

// Auth APIs
export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data, {
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
  }),
  getMe: () => api.get('/auth/me'),
  googleLogin: () => api.get('/auth/google'),
  githubLogin: () => api.get('/auth/github'),
}

// Users APIs
export const usersAPI = {
  getUsers: () => api.get('/users/'),
  getOnlineUsers: () => api.get('/users/online'),
  getUser: (userId) => api.get(`/users/${userId}`),
  updateProfile: (data) => api.put('/users/me', data),
}

// Rooms APIs
export const roomsAPI = {
  getRooms: () => api.get('/rooms/'),
  getRoom: (roomId) => api.get(`/rooms/${roomId}`),
  createRoom: (data) => api.post('/rooms/', data),
  joinRoom: (roomId) => api.post(`/rooms/${roomId}/join`),
  leaveRoom: (roomId) => api.post(`/rooms/${roomId}/leave`),
  getRoomMembers: (roomId) => api.get(`/rooms/${roomId}/members`),
  deleteRoom: (roomId) => api.delete(`/rooms/${roomId}`),
}

// Messages APIs
export const messagesAPI = {
  getRoomMessages: (roomId, limit = 50, offset = 0) => 
    api.get(`/messages/room/${roomId}`, { params: { limit, offset } }),
  getPrivateMessages: (userId, limit = 50, offset = 0) => 
    api.get(`/messages/private/${userId}`, { params: { limit, offset } }),
  sendMessage: (data) => api.post('/messages/', data),
}

export default api
