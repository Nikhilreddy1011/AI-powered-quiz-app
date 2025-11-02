import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import './UserMenu.css';

const UserMenu: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleLogout = () => {
    logout();
    setIsOpen(false);
    navigate('/');
  };

  const toggleMenu = () => {
    setIsOpen(!isOpen);
  };

  if (!user) return null;

  const getInitial = () => {
    return user.username.charAt(0).toUpperCase();
  };

  return (
    <div className="user-menu" ref={menuRef}>
      <button 
        className="user-avatar" 
        onClick={toggleMenu}
        aria-label="User menu"
      >
        {getInitial()}
      </button>

      {isOpen && (
        <div className="user-dropdown">
          <div className="user-dropdown-header">
            <div className="user-avatar-large">
              {getInitial()}
            </div>
            <div className="user-info">
              <h3>{user.username}</h3>
              <p>{user.email}</p>
            </div>
          </div>

          <div className="user-dropdown-divider"></div>

          <div className="user-dropdown-body">
            <div className="user-detail-item">
              <span className="detail-label">User ID</span>
              <span className="detail-value">#{user.id}</span>
            </div>
            <div className="user-detail-item">
              <span className="detail-label">Status</span>
              <span className={`detail-value status ${user.is_active ? 'active' : 'inactive'}`}>
                {user.is_active ? (
                  <>
                    <span className="status-dot"></span>
                    Active
                  </>
                ) : (
                  'Inactive'
                )}
              </span>
            </div>
          </div>

          <div className="user-dropdown-divider"></div>

          <div className="user-dropdown-menu">
            <button 
              className="menu-item" 
              onClick={() => { navigate('/profile'); setIsOpen(false); }}
            >
              <span className="menu-icon">👤</span>
              My Profile
            </button>
          </div>

          <div className="user-dropdown-divider"></div>

          <div className="user-dropdown-footer">
            <button 
              className="logout-button" 
              onClick={handleLogout}
            >
              <span className="logout-icon">🚪</span>
              Logout
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserMenu;
