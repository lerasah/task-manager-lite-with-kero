import React from 'react';
import './Input.css';

const Input = ({
  label,
  type = 'text',
  id,
  name,
  value,
  onChange,
  error,
  placeholder,
  required = false,
  disabled = false,
  ...rest
}) => {
  return (
    <div className="form-group">
      {label && (
        <label htmlFor={id || name}>
          {label}
          {required && <span className="required">*</span>}
        </label>
      )}
      <input
        type={type}
        id={id || name}
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        required={required}
        disabled={disabled}
        className={error ? 'input-error' : ''}
        {...rest}
      />
      {error && <span className="error-text">{error}</span>}
    </div>
  );
};

export default Input;
