import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getProject, getTasks, deleteProject } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { LoadingSpinner, ErrorMessage, Button } from '../common';
import './ProjectDetail.css';

const ProjectDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { showToast } = useToast();
  
  const [project, setProject] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isUserAssigned, setIsUserAssigned] = useState(false);
  const [canDeleteProject, setCanDeleteProject] = useState(false);
  const [hasAssignPermission, setHasAssignPermission] = useState(false);

  useEffect(() => {
    loadProjectData();
  }, [id]);

  const loadProjectData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch project details
      const projectResponse = await getProject(id);
      const projectData = projectResponse.data;
      setProject(projectData);

      // Fetch tasks for the project
      const tasksResponse = await getTasks(id);
      setTasks(tasksResponse.data || []);

      // Check if user is assigned to the project
      const userIsAssigned = projectData.members?.some(member => member.id === user?.id) || false;
      setIsUserAssigned(userIsAssigned);

      // Check if user can delete project (owner or has delete_any_project permission)
      const isOwner = projectData.created_by === user?.id;
      const hasDeletePermission = user?.permissions?.includes('delete_any_project') || false;
      setCanDeleteProject(isOwner || hasDeletePermission);

      // Check if user has assign_task permission
      const hasAssign = user?.permissions?.includes('assign_task') || false;
      setHasAssignPermission(hasAssign);

      setLoading(false);
    } catch (err) {
      setError(err.message || 'Failed to load project');
      setLoading(false);
    }
  };

  const handleDeleteProject = async () => {
    if (!window.confirm('Are you sure you want to delete this project? This will also delete all tasks and comments.')) {
      return;
    }

    try {
      await deleteProject(id);
      showToast('Project deleted successfully', 'success');
      navigate('/projects');
    } catch (err) {
      showToast(err.message || 'Failed to delete project', 'error');
    }
  };

  const handleCreateTask = () => {
    navigate(`/projects/${id}/tasks/new`);
  };

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

  if (loading) {
    return <LoadingSpinner />;
  }

  if (error) {
    return <ErrorMessage message={error} />;
  }

  if (!project) {
    return <ErrorMessage message="Project not found" />;
  }

  const groupedTasks = groupTasksByStatus();

  return (
    <div className="project-detail">
      <div className="project-header">
        <div className="project-info">
          <h1>{project.name}</h1>
          <p className="project-description">{project.description}</p>
          <p className="project-creator">
            Created by: <strong>{project.creator_name || 'Unknown'}</strong>
          </p>
        </div>
        <div className="project-actions">
          {isUserAssigned && (
            <Button onClick={handleCreateTask} variant="primary">
              Create Task
            </Button>
          )}
          {canDeleteProject && (
            <Button onClick={handleDeleteProject} variant="danger">
              Delete Project
            </Button>
          )}
        </div>
      </div>

      <div className="tasks-section">
        <h2>Tasks</h2>
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

export default ProjectDetail;
