import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { FaUserShield, FaUsers, FaComments, FaDoorOpen, FaChartBar, FaCrown, FaUserTie, FaUser, FaBan, FaCheck, FaTrash } from 'react-icons/fa'
import { useAuthStore } from '../utils/store'
import axios from 'axios'
import '../styles/admin.css'

function AdminPanel() {
  const navigate = useNavigate()
  const { token, user } = useAuthStore()
  const [stats, setStats] = useState(null)
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedUser, setSelectedUser] = useState(null)

  useEffect(() => {
    if (!user || (user.role !== 'admin' && user.role !== 'super_admin')) {
      navigate('/chat')
      return
    }
    loadData()
  }, [user])

  const loadData = async () => {
    try {
      const config = { headers: { Authorization: `Bearer ${token}` } }
      const [statsRes, usersRes] = await Promise.all([
        axios.get('http://localhost:8000/api/admin/stats', config),
        axios.get('http://localhost:8000/api/admin/users', config)
      ])
      setStats(statsRes.data)
      setUsers(usersRes.data)
      setLoading(false)
    } catch (error) {
      console.error('Failed to load admin data:', error)
      if (error.response?.status === 403) {
        alert('Access denied. Admin privileges required.')
        navigate('/chat')
      }
    }
  }

  const handleRoleChange = async (userId, newRole) => {
    if (!window.confirm(`Are you sure you want to change this user's role to ${newRole}?`)) {
      return
    }

    try {
      const config = { headers: { Authorization: `Bearer ${token}` } }
      await axios.put(
        `http://localhost:8000/api/admin/users/${userId}/role`,
        { role: newRole },
        config
      )
      alert('Role updated successfully!')
      loadData()
    } catch (error) {
      alert(error.response?.data?.detail || 'Failed to update role')
    }
  }

  const handleToggleActive = async (userId, isActive) => {
    const action = isActive ? 'deactivate' : 'activate'
    if (!window.confirm(`Are you sure you want to ${action} this user?`)) {
      return
    }

    try {
      const config = { headers: { Authorization: `Bearer ${token}` } }
      await axios.put(
        `http://localhost:8000/api/admin/users/${userId}/${action}`,
        {},
        config
      )
      alert(`User ${action}d successfully!`)
      loadData()
    } catch (error) {
      alert(error.response?.data?.detail || `Failed to ${action} user`)
    }
  }

  const handleDeleteUser = async (userId, username) => {
    if (!window.confirm(`⚠️ WARNING: Are you sure you want to PERMANENTLY DELETE user "${username}"? This action CANNOT be undone!`)) {
      return
    }

    const confirmText = window.prompt(`Type "${username}" to confirm deletion:`)
    if (confirmText !== username) {
      alert('Deletion cancelled. Username did not match.')
      return
    }

    try {
      const config = { headers: { Authorization: `Bearer ${token}` } }
      await axios.delete(
        `http://localhost:8000/api/admin/users/${userId}`,
        config
      )
      alert('User deleted successfully!')
      loadData()
    } catch (error) {
      alert(error.response?.data?.detail || 'Failed to delete user')
    }
  }

  const getRoleBadge = (role) => {
    const badges = {
      super_admin: { icon: <FaCrown />, color: '#faa61a', label: 'Super Admin' },
      admin: { icon: <FaUserShield />, color: '#ed4245', label: 'Admin' },
      moderator: { icon: <FaUserTie />, color: '#5865f2', label: 'Moderator' },
      user: { icon: <FaUser />, color: '#b9bbbe', label: 'User' }
    }
    return badges[role] || badges.user
  }

  if (loading) {
    return (
      <div className="admin-panel">
        <div className="loading">Loading admin panel...</div>
      </div>
    )
  }

  return (
    <div className="admin-panel">
      <div className="admin-header">
        <h1><FaUserShield /> Admin Panel</h1>
        <button className="btn-back" onClick={() => navigate('/chat')}>
          Back to Chat
        </button>
      </div>

      {/* Stats Cards */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon" style={{ background: '#5865f2' }}>
            <FaUsers />
          </div>
          <div className="stat-info">
            <div className="stat-value">{stats.total_users}</div>
            <div className="stat-label">Total Users</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ background: '#3ba55d' }}>
            <FaCheck />
          </div>
          <div className="stat-info">
            <div className="stat-value">{stats.active_users}</div>
            <div className="stat-label">Active Users</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ background: '#faa61a' }}>
            <FaChartBar />
          </div>
          <div className="stat-info">
            <div className="stat-value">{stats.online_users}</div>
            <div className="stat-label">Online Now</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ background: '#00b0f4' }}>
            <FaDoorOpen />
          </div>
          <div className="stat-info">
            <div className="stat-value">{stats.total_rooms}</div>
            <div className="stat-label">Total Rooms</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ background: '#ed4245' }}>
            <FaComments />
          </div>
          <div className="stat-info">
            <div className="stat-value">{stats.total_messages}</div>
            <div className="stat-label">Total Messages</div>
          </div>
        </div>
      </div>

      {/* Users Table */}
      <div className="admin-section">
        <h2>User Management</h2>
        <div className="users-table">
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Username</th>
                <th>Email</th>
                <th>Role</th>
                <th>Status</th>
                <th>Created</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => {
                const badge = getRoleBadge(u.role)
                return (
                  <tr key={u.id} className={!u.is_active ? 'inactive-user' : ''}>
                    <td>{u.id}</td>
                    <td>
                      <div className="user-cell">
                        {u.avatar_url ? (
                          <img src={u.avatar_url} alt="" className="table-avatar" />
                        ) : (
                          <div className="table-avatar-placeholder">{u.username[0].toUpperCase()}</div>
                        )}
                        <span>{u.username}</span>
                        {u.id === user.id && <span className="badge-you">You</span>}
                      </div>
                    </td>
                    <td>{u.email}</td>
                    <td>
                      <div className="role-badge" style={{ color: badge.color }}>
                        {badge.icon} {badge.label}
                      </div>
                    </td>
                    <td>
                      <span className={`status-badge ${u.is_active ? 'active' : 'inactive'}`}>
                        {u.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td>{new Date(u.created_at).toLocaleDateString()}</td>
                    <td>
                      <div className="action-buttons">
                        {user.role === 'super_admin' && u.id !== user.id && (
                          <select
                            className="role-select"
                            value={u.role}
                            onChange={(e) => handleRoleChange(u.id, e.target.value)}
                            disabled={u.role === 'super_admin'}
                          >
                            <option value="user">User</option>
                            <option value="moderator">Moderator</option>
                            <option value="admin">Admin</option>
                            {u.role === 'super_admin' && <option value="super_admin">Super Admin</option>}
                          </select>
                        )}
                        
                        {u.id !== user.id && u.role !== 'super_admin' && (
                          <>
                            <button
                              className={`btn-icon ${u.is_active ? 'btn-danger' : 'btn-success'}`}
                              onClick={() => handleToggleActive(u.id, u.is_active)}
                              title={u.is_active ? 'Deactivate' : 'Activate'}
                            >
                              {u.is_active ? <FaBan /> : <FaCheck />}
                            </button>
                            
                            {user.role === 'super_admin' && (
                              <button
                                className="btn-icon btn-danger"
                                onClick={() => handleDeleteUser(u.id, u.username)}
                                title="Delete User"
                              >
                                <FaTrash />
                              </button>
                            )}
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Role Distribution */}
      <div className="admin-section">
        <h2>Role Distribution</h2>
        <div className="role-stats">
          {Object.entries(stats.users_by_role).map(([role, count]) => {
            const badge = getRoleBadge(role)
            return (
              <div key={role} className="role-stat-item">
                <div className="role-stat-icon" style={{ color: badge.color }}>
                  {badge.icon}
                </div>
                <div className="role-stat-info">
                  <div className="role-stat-label">{badge.label}</div>
                  <div className="role-stat-count">{count}</div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

export default AdminPanel
