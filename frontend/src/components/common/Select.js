import React from 'react';
import './Select.css';

const Select = ({
  label,
  id,
  name,
  value,
  onChange,
  options = [],
  error,
  placeholder = 'Select an option',
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
      <select
        id={id || name}
        name={name}
        value={value}
        onChange={onChange}
        required={required}
        disabled={disabled}
        className={error ? 'select-error' : ''}
        {...rest}
      >
        <option value="">{placeholder}</option>
        {options.map((option) => (
          <option
            key={option.value}
            value={option.value}
          >
            {option.label}
          </option>
        ))}
      </select>
      {error && <span className="error-text">{error}</span>}
    </div>
  );
};

export default Select;
