import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import authService from '../../services/authService';
import './Profile.css';

interface UserProfile {
  id: number;
  username: string;
  email: string;
  avatar: string | null;
  created_at: string;
  is_active: boolean;
}

interface ProfileStats {
  username: string;
  email: string;
  avatar: string | null;
  member_since: string;
  total_completed_quizzes: number;
  ongoing_quizzes: number;
  is_active: boolean;
}

const Profile: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [stats, setStats] = useState<ProfileStats | null>(null);
  const [email, setEmail] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<'profile' | 'security'>('profile');

  useEffect(() => {
    fetchProfileData();
  }, []);

  const fetchProfileData = async () => {
    try {
      const token = authService.getToken();
      if (!token) return;

      // Fetch profile
      const profileRes = await fetch(`http://localhost:8000/profile/me?token=${token}`);
      const profileData = await profileRes.json();
      setProfile(profileData);
      setEmail(profileData.email);

      // Fetch stats
      const statsRes = await fetch(`http://localhost:8000/profile/stats?token=${token}`);
      const statsData = await statsRes.json();
      setStats(statsData);
    } catch (err) {
      console.error('Failed to fetch profile:', err);
      setError('Failed to load profile data');
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    setError('');

    try {
      const token = authService.getToken();
      const response = await fetch(`http://localhost:8000/profile/update?token=${token}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to update profile');
      }

      setMessage('Profile updated successfully!');
      fetchProfileData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    setError('');

    if (newPassword !== confirmPassword) {
      setError('New passwords do not match');
      setLoading(false);
      return;
    }

    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters');
      setLoading(false);
      return;
    }

    try {
      const token = authService.getToken();
      const response = await fetch(`http://localhost:8000/profile/change-password?token=${token}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          current_password: currentPassword,
          new_password: newPassword,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to change password');
      }

      setMessage('Password changed successfully!');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to change password');
    } finally {
      setLoading(false);
    }
  };

  if (!profile || !stats) {
    return (
      <div className="profile-loading">
        <div className="spinner"></div>
        <p>Loading profile...</p>
      </div>
    );
  }

  return (
    <div className="profile-container">
      <div className="profile-header">
        <button className="back-button" onClick={() => navigate('/dashboard')}>
          ← Back to Dashboard
        </button>
        <h1>My Profile</h1>
      </div>

      {/* Profile Card */}
      <div className="profile-card">
        <div className="profile-avatar-section">
          <div className="profile-avatar-large">
            {profile.username.charAt(0).toUpperCase()}
          </div>
          <div className="profile-info">
            <h2>{profile.username}</h2>
            <p>{profile.email}</p>
            <span className="member-badge">
              Member since {new Date(stats.member_since).toLocaleDateString()}
            </span>
          </div>
        </div>

        {/* Stats */}
        <div className="profile-stats-grid">
          <div className="profile-stat">
            <div className="stat-icon">🎯</div>
            <div className="stat-value">{stats.total_completed_quizzes}</div>
            <div className="stat-label">Quizzes Completed</div>
          </div>
          <div className="profile-stat">
            <div className="stat-icon">🔄</div>
            <div className="stat-value">{stats.ongoing_quizzes}</div>
            <div className="stat-label">In Progress</div>
          </div>
          <div className="profile-stat">
            <div className="stat-icon">✅</div>
            <div className="stat-value">{stats.is_active ? 'Active' : 'Inactive'}</div>
            <div className="stat-label">Account Status</div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="profile-tabs">
        <button
          className={`tab ${activeTab === 'profile' ? 'active' : ''}`}
          onClick={() => setActiveTab('profile')}
        >
          Profile Settings
        </button>
        <button
          className={`tab ${activeTab === 'security' ? 'active' : ''}`}
          onClick={() => setActiveTab('security')}
        >
          Security
        </button>
      </div>

      {/* Messages */}
      {message && (
        <div className="success-message">
          <span className="message-icon">✓</span>
          {message}
        </div>
      )}
      {error && (
        <div className="error-message">
          <span className="message-icon">⚠️</span>
          {error}
        </div>
      )}

      {/* Tab Content */}
      {activeTab === 'profile' ? (
        <div className="profile-form-section">
          <h3>Update Profile</h3>
          <form onSubmit={handleUpdateProfile}>
            <div className="form-group">
              <label>Username</label>
              <input
                type="text"
                value={profile.username}
                disabled
                className="disabled-input"
              />
              <span className="form-help">Username cannot be changed</span>
            </div>

            <div className="form-group">
              <label>Email Address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <button type="submit" disabled={loading} className="submit-btn">
              {loading ? 'Updating...' : 'Update Profile'}
            </button>
          </form>
        </div>
      ) : (
        <div className="profile-form-section">
          <h3>Change Password</h3>
          <form onSubmit={handleChangePassword}>
            <div className="form-group">
              <label>Current Password</label>
              <input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                required
                placeholder="Enter current password"
              />
            </div>

            <div className="form-group">
              <label>New Password</label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                placeholder="Enter new password"
                minLength={6}
              />
            </div>

            <div className="form-group">
              <label>Confirm New Password</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                placeholder="Confirm new password"
                minLength={6}
              />
            </div>

            <button type="submit" disabled={loading} className="submit-btn">
              {loading ? 'Changing...' : 'Change Password'}
            </button>
          </form>
        </div>
      )}

      {/* Quick Actions */}
      <div className="profile-actions">
        <button className="action-btn secondary" onClick={() => navigate('/dashboard')}>
          View Dashboard
        </button>
        <button className="action-btn primary" onClick={() => navigate('/quiz')}>
          Take a Quiz
        </button>
      </div>
    </div>
  );
};

export default Profile;
