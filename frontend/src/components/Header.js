import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import './Header.css';

const Header = () => {
  const { user, logout, isImpersonating, impersonatedUser, exitImpersonation } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleExitImpersonation = async () => {
    await exitImpersonation();
    window.location.reload();
  };

  const displayUser = isImpersonating ? impersonatedUser : user;

  // Check if user has create_user permission to show Admin Panel link
  const hasCreateUserPermission = displayUser?.permissions?.includes('create_user');

  return (
    <>
      {isImpersonating && (
        <div className="impersonation-banner">
          <span>You are impersonating {impersonatedUser?.name}</span>
          <button onClick={handleExitImpersonation} className="btn-exit-impersonation">
            Exit Impersonation
          </button>
        </div>
      )}
      <header className="header">
        <div className="header-content">
          <div className="header-left">
            <h1 onClick={() => navigate('/dashboard')}>Task Manager</h1>
            <nav>
              <button onClick={() => navigate('/dashboard')}>Dashboard</button>
              <button onClick={() => navigate('/projects')}>Projects</button>
              {hasCreateUserPermission && (
                <button onClick={() => navigate('/admin/users')}>Admin Panel</button>
              )}
            </nav>
          </div>
          <div className="header-right">
            <div className="user-info">
              <span className="user-name">{displayUser?.name}</span>
              <span className="user-role">({displayUser?.role_name})</span>
            </div>
            <button onClick={handleLogout} className="btn-logout">Logout</button>
          </div>
        </div>
      </header>
    </>
  );
};

export default Header;
