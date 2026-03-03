import React from 'react';
import './ErrorMessage.css';

const ErrorMessage = ({ message, onClose }) => {
  if (!message) return null;

  return (
    <div className="error-message">
      <span className="error-icon">⚠</span>
      <span className="error-content">{message}</span>
      {onClose && (
        <button className="error-close" onClick={onClose} aria-label="Close">
          ×
        </button>
      )}
    </div>
  );
};

export default ErrorMessage;
