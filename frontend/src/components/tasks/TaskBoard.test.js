import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import TaskBoard from './TaskBoard';

const mockNavigate = jest.fn();

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

describe('TaskBoard', () => {
  const mockTasks = [
    {
      id: 1,
      title: 'Task 1',
      description: 'Description 1',
      status: 'todo',
      assignee_name: 'John Doe',
      created_at: '2024-01-15T10:00:00Z',
    },
    {
      id: 2,
      title: 'Task 2',
      description: 'Description 2',
      status: 'in_progress',
      assignee_name: 'Jane Smith',
      created_at: '2024-01-16T10:00:00Z',
    },
    {
      id: 3,
      title: 'Task 3',
      description: 'Description 3',
      status: 'done',
      assignee_name: null,
      created_at: '2024-01-17T10:00:00Z',
    },
  ];

  beforeEach(() => {
    mockNavigate.mockClear();
  });

  const renderTaskBoard = (tasks = mockTasks, hasAssignPermission = false) => {
    return render(
      <BrowserRouter>
        <TaskBoard tasks={tasks} hasAssignPermission={hasAssignPermission} />
      </BrowserRouter>
    );
  };

  test('renders three columns: Todo, In Progress, Done', () => {
    renderTaskBoard();
    
    expect(screen.getByText(/To Do/i)).toBeInTheDocument();
    expect(screen.getByText(/In Progress/i)).toBeInTheDocument();
    expect(screen.getByText(/Done/i)).toBeInTheDocument();
  });

  test('displays tasks in correct columns based on status', () => {
    renderTaskBoard();
    
    expect(screen.getByText('Task 1')).toBeInTheDocument();
    expect(screen.getByText('Task 2')).toBeInTheDocument();
    expect(screen.getByText('Task 3')).toBeInTheDocument();
  });

  test('displays task count in column headers', () => {
    renderTaskBoard();
    
    expect(screen.getByText(/To Do \(1\)/i)).toBeInTheDocument();
    expect(screen.getByText(/In Progress \(1\)/i)).toBeInTheDocument();
    expect(screen.getByText(/Done \(1\)/i)).toBeInTheDocument();
  });

  test('displays task title, description, and assignee', () => {
    renderTaskBoard();
    
    expect(screen.getByText('Task 1')).toBeInTheDocument();
    expect(screen.getByText('Description 1')).toBeInTheDocument();
    expect(screen.getByText('John Doe')).toBeInTheDocument();
  });

  test('displays "Unassigned" when task has no assignee', () => {
    renderTaskBoard();
    
    expect(screen.getByText('Unassigned')).toBeInTheDocument();
  });

  test('clicking task card navigates to task detail', () => {
    renderTaskBoard();
    
    const taskCard = screen.getByText('Task 1').closest('.task-card');
    fireEvent.click(taskCard);
    
    expect(mockNavigate).toHaveBeenCalledWith('/tasks/1');
  });

  test('shows assign button when user has assign permission', () => {
    renderTaskBoard(mockTasks, true);
    
    const assignButtons = screen.getAllByText('Assign');
    expect(assignButtons).toHaveLength(3);
  });

  test('hides assign button when user lacks assign permission', () => {
    renderTaskBoard(mockTasks, false);
    
    const assignButtons = screen.queryAllByText('Assign');
    expect(assignButtons).toHaveLength(0);
  });

  test('clicking assign button navigates to assign page', () => {
    renderTaskBoard(mockTasks, true);
    
    const assignButtons = screen.getAllByText('Assign');
    fireEvent.click(assignButtons[0]);
    
    expect(mockNavigate).toHaveBeenCalledWith('/tasks/1/assign');
  });

  test('displays empty message when column has no tasks', () => {
    renderTaskBoard([]);
    
    const emptyMessages = screen.getAllByText('No tasks');
    expect(emptyMessages).toHaveLength(3);
  });

  test('formats date correctly', () => {
    renderTaskBoard();
    
    expect(screen.getByText(/Jan 15, 2024/i)).toBeInTheDocument();
  });
});
