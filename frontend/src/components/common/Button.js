import React from 'react';
import './Button.css';

const Button = ({
  children,
  type = 'button',
  variant = 'primary',
  loading = false,
  disabled = false,
  onClick,
  fullWidth = false,
  ...rest
}) => {
  const className = `btn btn-${variant} ${fullWidth ? 'btn-full-width' : ''}`;

  return (
    <button
      type={type}
      className={className}
      onClick={onClick}
      disabled={disabled || loading}
      {...rest}
    >
      {loading ? (
        <>
          <span className="spinner"></span>
          <span className="loading-text">Loading...</span>
        </>
      ) : (
        children
      )}
    </button>
  );
};

export default Button;
