import axios from 'axios'

const API_URL = 'http://localhost:8000/api'

// Get auth token from localStorage (same format as api.js)
const getAuthHeader = () => {
  const authStorage = localStorage.getItem('auth-storage')
  
  if (authStorage) {
    try {
      const parsed = JSON.parse(authStorage)
      const token = parsed?.state?.token
      
      if (token) {
        return { Authorization: `Bearer ${token}` }
      }
    } catch (e) {
      console.error('Error parsing auth storage:', e)
    }
  }
  
  return {}
}

export const reactionsAPI = {
  // Add or toggle a reaction
  addReaction: async (messageId, emoji) => {
    const response = await axios.post(
      `${API_URL}/reactions/messages/${messageId}`,
      { emoji },
      { headers: getAuthHeader() }
    )
    return response
  },

  // Remove a reaction
  removeReaction: async (messageId, emoji) => {
    const response = await axios.delete(
      `${API_URL}/reactions/messages/${messageId}/${emoji}`,
      { headers: getAuthHeader() }
    )
    return response
  },

  // Get reactions for a message
  getReactions: async (messageId) => {
    const response = await axios.get(
      `${API_URL}/reactions/messages/${messageId}`,
      { headers: getAuthHeader() }
    )
    return response.data
  }
}
