# Common Components

This directory contains reusable UI components used throughout the application.

## Components

### LoadingSpinner

A reusable loading spinner component for displaying loading states.

**Props:**
- `size` (string, optional): Size of the spinner - 'small', 'medium', or 'large'. Default: 'medium'
- `message` (string, optional): Message to display below the spinner. Default: 'Loading...'

**Usage:**
```jsx
import { LoadingSpinner } from './components/common';

// Basic usage
<LoadingSpinner />

// With custom message
<LoadingSpinner message="Loading projects..." />

// Different sizes
<LoadingSpinner size="small" message="Loading..." />
<LoadingSpinner size="large" message="Please wait..." />
```

### ErrorBoundary

A React error boundary component that catches JavaScript errors anywhere in the child component tree and displays a fallback UI.

**Props:**
- `children` (ReactNode): Child components to wrap

**Features:**
- Catches and logs errors to console
- Displays user-friendly error message
- Shows error details in development mode
- Provides "Refresh Page" and "Try Again" buttons
- Automatically resets error state when "Try Again" is clicked

**Usage:**
```jsx
import { ErrorBoundary } from './components/common';

// Wrap your app or specific components
<ErrorBoundary>
  <App />
</ErrorBoundary>

// Wrap specific sections
<ErrorBoundary>
  <ComplexComponent />
</ErrorBoundary>
```

### ErrorMessage

A component for displaying error messages with optional close button.

**Props:**
- `message` (string): Error message to display
- `onClose` (function, optional): Callback function when close button is clicked

**Usage:**
```jsx
import { ErrorMessage } from './components/common';

const [error, setError] = useState('');

// Basic usage
{error && <ErrorMessage message={error} />}

// With close button
{error && <ErrorMessage message={error} onClose={() => setError('')} />}
```

### Button

A reusable button component with loading state support.

**Props:**
- `children` (ReactNode): Button content
- `type` (string, optional): Button type - 'button', 'submit', or 'reset'. Default: 'button'
- `variant` (string, optional): Button style - 'primary', 'secondary', 'success', 'danger', or 'warning'. Default: 'primary'
- `loading` (boolean, optional): Whether to show loading spinner. Default: false
- `disabled` (boolean, optional): Whether button is disabled. Default: false
- `fullWidth` (boolean, optional): Whether button should take full width. Default: false
- `onClick` (function, optional): Click handler

**Usage:**
```jsx
import { Button } from './components/common';

// Basic usage
<Button onClick={handleClick}>Click Me</Button>

// With loading state
<Button loading={isLoading}>Submit</Button>

// Different variants
<Button variant="danger" onClick={handleDelete}>Delete</Button>
<Button variant="success">Save</Button>

// Full width
<Button fullWidth>Full Width Button</Button>
```

### Input

A reusable input component with label and error display.

**Props:**
- `label` (string): Input label
- `type` (string, optional): Input type. Default: 'text'
- `value` (string): Input value
- `onChange` (function): Change handler
- `error` (string, optional): Error message to display
- `required` (boolean, optional): Whether input is required
- `disabled` (boolean, optional): Whether input is disabled
- Additional HTML input attributes

**Usage:**
```jsx
import { Input } from './components/common';

<Input
  label="Email"
  type="email"
  value={email}
  onChange={(e) => setEmail(e.target.value)}
  error={emailError}
  required
/>
```

### Select

A reusable select dropdown component.

**Props:**
- `label` (string): Select label
- `value` (string): Selected value
- `onChange` (function): Change handler
- `options` (array): Array of option objects with `value` and `label` properties
- `error` (string, optional): Error message to display
- `required` (boolean, optional): Whether select is required
- `disabled` (boolean, optional): Whether select is disabled

**Usage:**
```jsx
import { Select } from './components/common';

const statusOptions = [
  { value: 'todo', label: 'To Do' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'done', label: 'Done' }
];

<Select
  label="Status"
  value={status}
  onChange={(e) => setStatus(e.target.value)}
  options={statusOptions}
  required
/>
```

## Example: Complete Form with Loading and Error States

```jsx
import React, { useState } from 'react';
import { Input, Button, ErrorMessage, LoadingSpinner } from './components/common';
import { createProject } from '../services/api';

const ProjectForm = () => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await createProject({ name, description });
      // Success handling
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      {error && <ErrorMessage message={error} onClose={() => setError('')} />}
      
      <Input
        label="Project Name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        required
        disabled={loading}
      />
      
      <Input
        label="Description"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        disabled={loading}
      />
      
      <Button type="submit" loading={loading} fullWidth>
        Create Project
      </Button>
    </form>
  );
};
```

## Example: Page with Loading State

```jsx
import React, { useState, useEffect } from 'react';
import { LoadingSpinner, ErrorMessage } from './components/common';
import { getProjects } from '../services/api';

const ProjectList = () => {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = async () => {
    try {
      const response = await getProjects();
      setProjects(response.data.projects);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <LoadingSpinner message="Loading projects..." />;
  }

  return (
    <div>
      {error && <ErrorMessage message={error} onClose={() => setError('')} />}
      {/* Render projects */}
    </div>
  );
};
```

### Toast Notification System

A toast notification system for displaying temporary success/error/info messages.

**Components:**
- `Toast`: Individual toast notification component
- `ToastContainer`: Container that manages and displays multiple toasts
- `ToastContext`: Context provider for global toast access

**Setup:**

The `ToastProvider` is already wrapped around the app in `App.js`.

**Usage:**

Import the `useToast` hook in any component:

```jsx
import { useToast } from '../contexts/ToastContext';

function MyComponent() {
  const { showSuccess, showError, showInfo } = useToast();

  const handleSuccess = () => {
    showSuccess('Operation completed successfully!');
  };

  const handleError = () => {
    showError('Something went wrong!');
  };

  const handleInfo = () => {
    showInfo('Here is some information.');
  };

  return (
    <div>
      <button onClick={handleSuccess}>Show Success</button>
      <button onClick={handleError}>Show Error</button>
      <button onClick={handleInfo}>Show Info</button>
    </div>
  );
}
```

**API:**

- `showSuccess(message, duration?)` - Display a success toast
- `showError(message, duration?)` - Display an error toast
- `showInfo(message, duration?)` - Display an info toast

**Parameters:**
- `message` (string, required): The message to display
- `duration` (number, optional): Auto-dismiss duration in milliseconds (default: 3000)

**Features:**
- Auto-dismiss after 3 seconds (configurable)
- Manual dismiss via close button
- Multiple toasts stack vertically
- Smooth slide-in animation
- Consistent styling with app theme
- Positioned at top-right of viewport

**Example: Using Toast with API Calls**

```jsx
import React, { useState } from 'react';
import { useToast } from '../contexts/ToastContext';
import { createProject } from '../services/api';
import { Button, Input } from './common';

const CreateProjectForm = () => {
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const { showSuccess, showError } = useToast();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await createProject({ name });
      showSuccess('Project created successfully!');
      setName('');
    } catch (err) {
      showError(err.message || 'Failed to create project');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <Input
        label="Project Name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        required
      />
      <Button type="submit" loading={loading}>
        Create Project
      </Button>
    </form>
  );
};
```

**Example: Custom Duration**

```jsx
// Show toast for 5 seconds instead of default 3 seconds
showSuccess('This will stay longer!', 5000);

// Show toast that doesn't auto-dismiss (duration = 0)
showError('Critical error - manual dismiss only', 0);
```
