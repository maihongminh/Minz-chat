import React, { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { authAPI } from '../services/api'
import { useAuthStore } from '../utils/store'
import '../styles/auth.css'

function Login() {
  const navigate = useNavigate()
  const setAuth = useAuthStore((state) => state.setAuth)
  const [formData, setFormData] = useState({ username: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const params = new URLSearchParams()
      params.append('username', formData.username)
      params.append('password', formData.password)
      
      const response = await authAPI.login(params)
      setAuth(response.data.access_token, response.data.user)
      navigate('/chat')
    } catch (err) {
      setError(err.response?.data?.detail || 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  const handleOAuthLogin = async (provider) => {
    try {
      const response = provider === 'google' 
        ? await authAPI.googleLogin()
        : await authAPI.githubLogin()
      
      window.location.href = response.data.url
    } catch (err) {
      setError('OAuth login not configured')
    }
  }

  return (
    <div className="auth-container">
      <div className="auth-box">
        <h1>Welcome back!</h1>
        <p className="auth-subtitle">We're so excited to see you again!</p>

        {error && <div className="error-message">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Username</label>
            <input
              type="text"
              value={formData.username}
              onChange={(e) => setFormData({ ...formData, username: e.target.value })}
              required
            />
          </div>

          <div className="form-group">
            <label>Password</label>
            <input
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              required
            />
          </div>

          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>

        <div className="oauth-section">
          <div className="divider">
            <span>OR</span>
          </div>
          
          <button className="btn-oauth google" onClick={() => handleOAuthLogin('google')}>
            Login with Google
          </button>
          
          <button className="btn-oauth github" onClick={() => handleOAuthLogin('github')}>
            Login with GitHub
          </button>
        </div>

        <div className="auth-footer">
          Need an account? <Link to="/register">Register</Link>
        </div>
      </div>
    </div>
  )
}

export default Login
