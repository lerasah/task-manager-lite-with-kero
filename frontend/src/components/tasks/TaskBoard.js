import { useNavigate } from 'react-router-dom';
import { Button } from '../common';
import './TaskBoard.css';

const TaskBoard = ({ tasks, hasAssignPermission }) => {
  const navigate = useNavigate();

  const handleTaskClick = (taskId) => {
    navigate(`/tasks/${taskId}`);
  };

  const handleAssignTask = (taskId) => {
    navigate(`/tasks/${taskId}/assign`);
  };

  const groupTasksByStatus = () => {
    const grouped = {
      todo: [],
      in_progress: [],
      done: []
    };

    tasks.forEach(task => {
      if (grouped[task.status]) {
        grouped[task.status].push(task);
      }
    });

    return grouped;
  };

  const groupedTasks = groupTasksByStatus();

  return (
    <div className="tasks-board">
      <div className="task-column">
        <h3 className="column-header todo-header">
          To Do ({groupedTasks.todo.length})
        </h3>
        <div className="task-list">
          {groupedTasks.todo.map(task => (
            <TaskCard
              key={task.id}
              task={task}
              onTaskClick={handleTaskClick}
              onAssignClick={handleAssignTask}
              hasAssignPermission={hasAssignPermission}
            />
          ))}
          {groupedTasks.todo.length === 0 && (
            <p className="empty-message">No tasks</p>
          )}
        </div>
      </div>

      <div className="task-column">
        <h3 className="column-header in-progress-header">
          In Progress ({groupedTasks.in_progress.length})
        </h3>
        <div className="task-list">
          {groupedTasks.in_progress.map(task => (
            <TaskCard
              key={task.id}
              task={task}
              onTaskClick={handleTaskClick}
              onAssignClick={handleAssignTask}
              hasAssignPermission={hasAssignPermission}
            />
          ))}
          {groupedTasks.in_progress.length === 0 && (
            <p className="empty-message">No tasks</p>
          )}
        </div>
      </div>

      <div className="task-column">
        <h3 className="column-header done-header">
          Done ({groupedTasks.done.length})
        </h3>
        <div className="task-list">
          {groupedTasks.done.map(task => (
            <TaskCard
              key={task.id}
              task={task}
              onTaskClick={handleTaskClick}
              onAssignClick={handleAssignTask}
              hasAssignPermission={hasAssignPermission}
            />
          ))}
          {groupedTasks.done.length === 0 && (
            <p className="empty-message">No tasks</p>
          )}
        </div>
      </div>
    </div>
  );
};

const TaskCard = ({ task, onTaskClick, onAssignClick, hasAssignPermission }) => {
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  return (
    <div className="task-card" onClick={() => onTaskClick(task.id)}>
      <h4 className="task-title">{task.title}</h4>
      {task.description && (
        <p className="task-description">{task.description}</p>
      )}
      <div className="task-meta">
        <p className="task-assignee">
          Assignee: <strong>{task.assignee_name || 'Unassigned'}</strong>
        </p>
        <p className="task-date">
          Created: {formatDate(task.created_at)}
        </p>
      </div>
      {hasAssignPermission && (
        <div className="task-actions">
          <Button
            onClick={(e) => {
              e.stopPropagation();
              onAssignClick(task.id);
            }}
            variant="secondary"
            size="small"
          >
            Assign
          </Button>
        </div>
      )}
    </div>
  );
};

export default TaskBoard;
