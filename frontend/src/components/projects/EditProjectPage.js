import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ProjectForm } from './index';
import { getProject, updateProject } from '../../services/api';
import { LoadingSpinner, ErrorMessage } from '../common';
import { useToast } from '../../contexts/ToastContext';
import './EditProjectPage.css';

const EditProjectPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { showError } = useToast();
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchProject = async () => {
      try {
        setLoading(true);
        const response = await getProject(id);
        if (response.success && response.data) {
          setProject(response.data);
        }
      } catch (err) {
        setError(err.message || 'Failed to load project');
        showError(err.message || 'Failed to load project');
      } finally {
        setLoading(false);
      }
    };

    fetchProject();
  }, [id, showError]);

  const handleSubmit = async (formData) => {
    await updateProject(id, formData);
    navigate(`/projects/${id}`);
  };

  const handleCancel = () => {
    navigate(`/projects/${id}`);
  };

  if (loading) {
    return (
      <div className="edit-project-page">
        <LoadingSpinner />
      </div>
    );
  }

  if (error) {
    return (
      <div className="edit-project-page">
        <ErrorMessage message={error} />
      </div>
    );
  }

  return (
    <div className="edit-project-page">
      <ProjectForm 
        project={project}
        onSubmit={handleSubmit}
        onCancel={handleCancel}
      />
    </div>
  );
};

export default EditProjectPage;
