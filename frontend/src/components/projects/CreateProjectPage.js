import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ProjectForm } from './index';
import { createProject } from '../../services/api';
import './CreateProjectPage.css';

const CreateProjectPage = () => {
  const navigate = useNavigate();

  const handleSubmit = async (formData) => {
    const response = await createProject(formData);
    
    // Navigate to the newly created project
    if (response.success && response.data) {
      navigate(`/projects/${response.data.id}`);
    } else {
      // Navigate to projects list
      navigate('/projects');
    }
  };

  const handleCancel = () => {
    navigate('/projects');
  };

  return (
    <div className="create-project-page">
      <ProjectForm 
        onSubmit={handleSubmit}
        onCancel={handleCancel}
      />
    </div>
  );
};

export default CreateProjectPage;
