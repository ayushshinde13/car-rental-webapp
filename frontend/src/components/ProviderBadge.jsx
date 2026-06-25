import React from 'react';
import './ProviderBadge.css';

const ProviderBadge = ({ provider, size = 'medium' }) => {
  const initials = provider.name ? provider.name.charAt(0).toUpperCase() : '?';
  
  return (
    <div className={`provider-badge ${size}`}>
      <div className="provider-avatar">
        {provider.avatar ? (
          <img 
            src={provider.avatar} 
            alt={`${provider.name}'s avatar`}
            onError={(e) => {
              e.target.style.display = 'none';
              e.target.nextSibling.style.display = 'flex';
            }}
          />
        ) : (
          <div className="avatar-initials">{initials}</div>
        )}
        {!provider.avatar && (
          <div className="default-avatar" style={{display: 'none'}}>{initials}</div>
        )}
      </div>
      <div className="provider-info">
        <span className="provider-name">{provider.name || 'Unknown Provider'}</span>
        <span className="verification-badge">✓ Verified</span>
      </div>
    </div>
  );
};

export default ProviderBadge;