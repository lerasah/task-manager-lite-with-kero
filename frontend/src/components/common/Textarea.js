import React from 'react';
import './Textarea.css';

const Textarea = ({
  label,
  id,
  name,
  value,
  onChange,
  error,
  placeholder,
  required = false,
  disabled = false,
  rows = 4,
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
      <textarea
        id={id || name}
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        required={required}
        disabled={disabled}
        rows={rows}
        className={error ? 'textarea-error' : ''}
        {...rest}
      />
      {error && <span className="error-text">{error}</span>}
    </div>
  );
};

export default Textarea;
