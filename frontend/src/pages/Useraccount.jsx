import React, { useContext } from 'react';
import { AuthContext } from '../contexts/AuthContext';
import './UserAccount.css';

const UserAccount = () => {
  const { user } = useContext(AuthContext);

  if (!user) {
    return (
      <div className="profile-container">
        <h1>Profile</h1>
        <p>Please log in to view your profile.</p>
      </div>
    );
  }

  return (
    <div className="profile-container">
      <div className="profile-header">
        <h1>Profile: {user.name}</h1>
        <p>Manage your account information</p>
      </div>
      
      <div className="profile-content">
        <div className="profile-card">
          <div className="avatar-section">
            <div className="avatar-placeholder">
              {user.avatar ? (
                <img src={user.avatar} alt={user.name} />
              ) : (
                <span className="initials">{user.name.charAt(0).toUpperCase()}</span>
              )}
            </div>
            <button className="change-avatar-btn">Change Avatar</button>
          </div>
          
          <div className="info-section">
            <h2>Personal Information</h2>
            <div className="info-item">
              <label>Name:</label>
              <span>{user.name}</span>
            </div>
            <div className="info-item">
              <label>Email:</label>
              <span>{user.email}</span>
            </div>
            <div className="info-item">
              <label>Role:</label>
              <span>{user.role}</span>
            </div>
            <div className="info-item">
              <label>Member Since:</label>
              <span>{user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'Unknown'}</span>
            </div>
          </div>
          
          <div className="actions-section">
            <button className="edit-profile-btn">Edit Profile</button>
            <button className="change-password-btn">Change Password</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserAccount;