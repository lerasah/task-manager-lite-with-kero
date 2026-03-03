import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from '../../contexts/AuthContext';
import { ToastProvider } from '../../contexts/ToastContext';
import TaskForm from './TaskForm';

// Mock useNavigate
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
  useParams: () => ({ id: '1' })
}));

// Mock API calls
jest.mock('../../services/api', () => ({
  getProject: jest.fn(() => Promise.resolve({
    data: {
      id: 1,
      name: 'Test Project',
      created_by: 1,
      members: [
        { id: 1, name: 'Test User' },
        { id: 2, name: 'Another User' }
      ]
    }
  })),
  createTask: jest.fn(() => Promise.resolve({ data: { id: 1 } })),
  updateTask: jest.fn(() => Promise.resolve({ data: { task: { id: 1 } } }))
}));

// Mock localStorage
const mockUser = {
  id: 1,
  name: 'Test User',
  email: 'test@example.com',
  role_id: 2,
  permissions: ['assign_task']
};

Storage.prototype.getItem = jest.fn((key) => {
  if (key === 'user') return JSON.stringify(mockUser);
  if (key === 'token') return 'mock-token';
  return null;
});

const Wrapper = ({ children }) => (
  <BrowserRouter>
    <ToastProvider>
      <AuthProvider>
        {children}
      </AuthProvider>
    </ToastProvider>
  </BrowserRouter>
);

describe('TaskForm Component', () => {
  test('renders create task form with title field', async () => {
    render(<TaskForm projectId="1" />, { wrapper: Wrapper });

    await waitFor(() => {
      expect(screen.getByText('Create New Task')).toBeInTheDocument();
    });

    expect(screen.getByLabelText(/Task Title/i)).toBeInTheDocument();
  });

  test('validates required title field', async () => {
    render(<TaskForm projectId="1" />, { wrapper: Wrapper });

    await waitFor(() => {
      expect(screen.getByText('Create New Task')).toBeInTheDocument();
    });

    const submitButton = screen.getByRole('button', { name: /Create Task/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('Task title is required')).toBeInTheDocument();
    });
  });

  test('renders all form fields', async () => {
    render(<TaskForm projectId="1" />, { wrapper: Wrapper });

    await waitFor(() => {
      expect(screen.getByLabelText(/Task Title/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Description/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Status/i)).toBeInTheDocument();
    });
  });
});
