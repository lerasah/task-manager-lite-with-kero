import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import ProjectForm from './ProjectForm';
import { ToastProvider } from '../../contexts/ToastContext';

// Wrapper component to provide context
const Wrapper = ({ children }) => (
  <ToastProvider>
    {children}
  </ToastProvider>
);

describe('ProjectForm', () => {
  test('renders create form with empty fields', () => {
    render(
      <ProjectForm onSubmit={jest.fn()} />,
      { wrapper: Wrapper }
    );

    expect(screen.getByText('Create New Project')).toBeInTheDocument();
    expect(screen.getByLabelText(/Project Name/i)).toHaveValue('');
    expect(screen.getByLabelText(/Description/i)).toHaveValue('');
    expect(screen.getByRole('button', { name: /Create Project/i })).toBeInTheDocument();
  });

  test('renders edit form with project data', () => {
    const project = {
      name: 'Test Project',
      description: 'Test Description'
    };

    render(
      <ProjectForm project={project} onSubmit={jest.fn()} />,
      { wrapper: Wrapper }
    );

    expect(screen.getByText('Edit Project')).toBeInTheDocument();
    expect(screen.getByLabelText(/Project Name/i)).toHaveValue('Test Project');
    expect(screen.getByLabelText(/Description/i)).toHaveValue('Test Description');
    expect(screen.getByRole('button', { name: /Update Project/i })).toBeInTheDocument();
  });

  test('shows validation error when name is empty', async () => {
    const onSubmit = jest.fn();
    
    render(
      <ProjectForm onSubmit={onSubmit} />,
      { wrapper: Wrapper }
    );

    const submitButton = screen.getByRole('button', { name: /Create Project/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('Project name is required')).toBeInTheDocument();
    });

    expect(onSubmit).not.toHaveBeenCalled();
  });

  test('calls onSubmit with form data when valid', async () => {
    const onSubmit = jest.fn().mockResolvedValue();
    
    render(
      <ProjectForm onSubmit={onSubmit} />,
      { wrapper: Wrapper }
    );

    const nameInput = screen.getByLabelText(/Project Name/i);
    const descriptionInput = screen.getByLabelText(/Description/i);
    const submitButton = screen.getByRole('button', { name: /Create Project/i });

    fireEvent.change(nameInput, { target: { value: 'New Project' } });
    fireEvent.change(descriptionInput, { target: { value: 'New Description' } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith({
        name: 'New Project',
        description: 'New Description'
      });
    });
  });

  test('clears validation error when user types', async () => {
    render(
      <ProjectForm onSubmit={jest.fn()} />,
      { wrapper: Wrapper }
    );

    const submitButton = screen.getByRole('button', { name: /Create Project/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('Project name is required')).toBeInTheDocument();
    });

    const nameInput = screen.getByLabelText(/Project Name/i);
    fireEvent.change(nameInput, { target: { value: 'Test' } });

    await waitFor(() => {
      expect(screen.queryByText('Project name is required')).not.toBeInTheDocument();
    });
  });

  test('shows cancel button when onCancel is provided', () => {
    const onCancel = jest.fn();
    
    render(
      <ProjectForm onSubmit={jest.fn()} onCancel={onCancel} />,
      { wrapper: Wrapper }
    );

    const cancelButton = screen.getByRole('button', { name: /Cancel/i });
    expect(cancelButton).toBeInTheDocument();
    
    fireEvent.click(cancelButton);
    expect(onCancel).toHaveBeenCalled();
  });

  test('disables form when loading', () => {
    render(
      <ProjectForm onSubmit={jest.fn()} loading={true} />,
      { wrapper: Wrapper }
    );

    expect(screen.getByLabelText(/Project Name/i)).toBeDisabled();
    expect(screen.getByLabelText(/Description/i)).toBeDisabled();
    expect(screen.getByRole('button', { name: /Loading/i })).toBeDisabled();
  });

  test('allows description to be empty', async () => {
    const onSubmit = jest.fn().mockResolvedValue();
    
    render(
      <ProjectForm onSubmit={onSubmit} />,
      { wrapper: Wrapper }
    );

    const nameInput = screen.getByLabelText(/Project Name/i);
    const submitButton = screen.getByRole('button', { name: /Create Project/i });

    fireEvent.change(nameInput, { target: { value: 'Project Name Only' } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith({
        name: 'Project Name Only',
        description: ''
      });
    });
  });
});
