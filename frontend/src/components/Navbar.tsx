import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import UserMenu from './UserMenu';
import './Navbar.css';

const Navbar: React.FC = () => {
  const { isAuthenticated } = useAuth();

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <Link to={isAuthenticated ? "/quiz" : "/"} className="navbar-logo">
          <span className="logo-icon">🎯</span>
          Quiz Generator
        </Link>

        <div className="navbar-menu">
          {isAuthenticated ? (
            <UserMenu />
          ) : (
            <>
              <Link to="/login" className="navbar-button">
                Login
              </Link>
              <Link to="/register" className="navbar-button primary">
                Sign Up
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
