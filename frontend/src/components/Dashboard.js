import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { getProjects } from '../services/api';
import { useNavigate } from 'react-router-dom';
import { LoadingSpinner, ErrorMessage } from './common';
import './Dashboard.css';

const Dashboard = () => {
  const { user, impersonatedUser, isImpersonating } = useAuth();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const displayUser = isImpersonating ? impersonatedUser : user;
  
  // Check if user has create_project permission
  const hasCreateProjectPermission = displayUser?.permissions?.includes('create_project');

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
    return (
      <div className="dashboard">
        <LoadingSpinner message="Loading projects..." />
      </div>
    );
  }

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <div>
          <h1>Welcome, {displayUser?.name}!</h1>
          <p>You have {projects.length} project{projects.length !== 1 ? 's' : ''}</p>
        </div>
        {hasCreateProjectPermission && (
          <button 
            className="create-project-btn"
            onClick={() => navigate('/projects/new')}
          >
            Create Project
          </button>
        )}
      </div>

      {error && <ErrorMessage message={error} onClose={() => setError('')} />}

      <div className="projects-grid">
        {projects.length === 0 ? (
          <div className="no-projects">
            <p>No projects yet. {hasCreateProjectPermission ? 'Create your first project to get started!' : 'You will see projects here when you are assigned to them.'}</p>
          </div>
        ) : (
          projects.map((project) => (
            <div
              key={project.id}
              className="project-card"
              onClick={() => navigate(`/projects/${project.id}`)}
            >
              <h3>{project.name}</h3>
              <p className="project-description">{project.description || 'No description'}</p>
              <div className="project-meta">
                <span className="task-count">{project.task_count} tasks</span>
                <span className="creator">by {project.creator_name}</span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default Dashboard;
