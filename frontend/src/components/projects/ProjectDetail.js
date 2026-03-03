import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getProject, getTasks, deleteProject } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { LoadingSpinner, ErrorMessage, Button } from '../common';
import ProjectMembers from './ProjectMembers';
import TaskBoard from '../tasks/TaskBoard';
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

  useEffect(() => {
    loadProjectData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

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

  if (loading) {
    return <LoadingSpinner />;
  }

  if (error) {
    return <ErrorMessage message={error} />;
  }

  if (!project) {
    return <ErrorMessage message="Project not found" />;
  }

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
        <TaskBoard tasks={tasks} hasAssignPermission={hasAssignPermission} />
      </div>

      <ProjectMembers project={project} onMemberChange={loadProjectData} />
    </div>
  );
};

export default ProjectDetail;
