import React, { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { FaUser, FaLock, FaGoogle, FaGithub } from 'react-icons/fa'
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
      {/* Animated Ocean */}
      <div className="ocean">
        <div className="wave wave1"></div>
        <div className="wave wave2"></div>
        <div className="wave wave3"></div>
      </div>
      {/* Bubbles */}
      <div className="bubbles">
        {[...Array(10)].map((_, i) => (
          <div key={i} className={`bubble bubble-${i + 1}`}></div>
        ))}
      </div>
      {/* Left Side - Form */}
      <div className="auth-left">
        <div className="auth-form-wrapper">
          <div className="auth-logo">
            <div className="logo-icon">💬</div>
            <h1 className="logo-text">HiHi Chat</h1>
          </div>

          <div className="auth-header">
            <h2>Welcome Back!</h2>
            <p>Sign in to continue to your account</p>
          </div>

          {error && <div className="error-message">{error}</div>}

          <form onSubmit={handleSubmit} className="auth-form">
            <div className="form-group">
              <label>USERNAME</label>
              <div className="input-with-icon">
                <FaUser className="input-icon" />
                <input
                  type="text"
                  placeholder="Enter your username"
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label>PASSWORD</label>
              <div className="input-with-icon">
                <FaLock className="input-icon" />
                <input
                  type="password"
                  placeholder="Enter your password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  required
                />
              </div>
            </div>

            <div className="form-options">
              <label className="checkbox-label">
                <input type="checkbox" />
                <span>Remember me</span>
              </label>
              <Link to="/forgot-password" className="forgot-link">Forgot password?</Link>
            </div>

            <button type="submit" className="btn-login" disabled={loading}>
              {loading ? (
                <>
                  <span className="spinner"></span>
                  Signing in...
                </>
              ) : (
                'Sign In'
              )}
            </button>
          </form>

          <div className="divider">
            <span>Or continue with</span>
          </div>

          <div className="oauth-buttons">
            <button className="btn-oauth google" onClick={() => handleOAuthLogin('google')}>
              <FaGoogle />
              <span>Google</span>
            </button>
            
            <button className="btn-oauth github" onClick={() => handleOAuthLogin('github')}>
              <FaGithub />
              <span>GitHub</span>
            </button>
          </div>

          <div className="auth-footer">
            Don't have an account? <Link to="/register">Sign Up</Link>
          </div>
        </div>
      </div>

      {/* Right Side - Branding */}
      <div className="auth-right">
        <div className="branding-content">
          <div className="branding-icon">
            <div className="floating-chat">
              <div className="chat-bubble bubble-1">👋</div>
              <div className="chat-bubble bubble-2">💬</div>
              <div className="chat-bubble bubble-3">🎉</div>
            </div>
          </div>
          <h2>Connect with Friends</h2>
          <p>Join millions of users in real-time conversations. Share moments, ideas, and stay connected.</p>
          <div className="features">
            <div className="feature-item">
              <div className="feature-icon">⚡</div>
              <span>Real-time messaging</span>
            </div>
            <div className="feature-item">
              <div className="feature-icon">🔒</div>
              <span>Secure & Private</span>
            </div>
            <div className="feature-item">
              <div className="feature-icon">🌐</div>
              <span>Connect Anywhere</span>
            </div>
          </div>
        </div>
        <div className="gradient-overlay"></div>
      </div>
    </div>
  )
}

export default Login
