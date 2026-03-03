# Project Components

This directory contains components related to project management.

## ProjectForm

A reusable form component for creating and editing projects.

### Props

- `project` (object, optional): Existing project data for edit mode. If not provided, the form operates in create mode.
  - `name` (string): Project name
  - `description` (string): Project description
- `onSubmit` (function, required): Callback function called when form is submitted. Receives form data as parameter.
- `onCancel` (function, optional): Callback function called when cancel button is clicked.
- `loading` (boolean, optional): External loading state to disable form during async operations.

### Features

- Client-side validation for required fields
- Real-time error display
- Loading state during submission
- Success/error toast notifications
- Supports both create and edit modes
- Responsive design

### Usage

#### Creating a new project

```jsx
import { ProjectForm } from './components/projects';
import { createProject } from './services/api';

function CreateProject() {
  const handleSubmit = async (formData) => {
    await createProject(formData);
    // Handle success (e.g., navigate to project list)
  };

  const handleCancel = () => {
    // Handle cancel (e.g., navigate back)
  };

  return (
    <ProjectForm 
      onSubmit={handleSubmit}
      onCancel={handleCancel}
    />
  );
}
```

#### Editing an existing project

```jsx
import { ProjectForm } from './components/projects';
import { updateProject } from './services/api';

function EditProject({ project }) {
  const handleSubmit = async (formData) => {
    await updateProject(project.id, formData);
    // Handle success
  };

  return (
    <ProjectForm 
      project={project}
      onSubmit={handleSubmit}
    />
  );
}
```

### Validation Rules

- **Name**: Required field. Cannot be empty or whitespace only.
- **Description**: Optional field.

### Error Handling

The component handles errors in two ways:

1. **Validation errors**: Displayed inline below the relevant input field
2. **API errors**: Displayed as toast notifications using the ToastContext

### Dependencies

- `Input`, `Button`, `ErrorMessage` from `../common`
- `useToast` from `../../contexts/ToastContext`

## CreateProjectPage

A complete page component that uses ProjectForm to create new projects.

### Features

- Integrates with API service
- Handles navigation after successful creation
- Provides cancel functionality

## EditProjectPage

A complete page component that uses ProjectForm to edit existing projects.

### Features

- Fetches project data on mount
- Shows loading spinner while fetching
- Displays error message if fetch fails
- Integrates with API service
- Handles navigation after successful update
