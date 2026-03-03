import React, { useState, useEffect } from 'react';
import { Input, Button, ErrorMessage } from '../common';
import { useToast } from '../../contexts/ToastContext';
import './ProjectForm.css';

const ProjectForm = ({ 
  project = null, 
  onSubmit, 
  onCancel,
  loading = false 
}) => {
  const [formData, setFormData] = useState({
    name: '',
    description: ''
  });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { showSuccess, showError } = useToast();

  // Populate form when editing existing project
  useEffect(() => {
    if (project) {
      setFormData({
        name: project.name || '',
        description: project.description || ''
      });
    }
  }, [project]);

  const validateForm = () => {
    const newErrors = {};

    // Name is required
    if (!formData.name.trim()) {
      newErrors.name = 'Project name is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // Clear error for this field when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      await onSubmit(formData);
      showSuccess(project ? 'Project updated successfully' : 'Project created successfully');
      
      // Reset form if creating new project
      if (!project) {
        setFormData({
          name: '',
          description: ''
        });
      }
    } catch (error) {
      showError(error.message || 'Failed to save project');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="project-form">
      <h2>{project ? 'Edit Project' : 'Create New Project'}</h2>
      
      <form onSubmit={handleSubmit}>
        <Input
          label="Project Name"
          name="name"
          value={formData.name}
          onChange={handleChange}
          error={errors.name}
          placeholder="Enter project name"
          required
          disabled={isSubmitting || loading}
        />

        <Input
          label="Description"
          name="description"
          value={formData.description}
          onChange={handleChange}
          error={errors.description}
          placeholder="Enter project description (optional)"
          disabled={isSubmitting || loading}
        />

        {errors.general && <ErrorMessage message={errors.general} />}

        <div className="form-actions">
          <Button
            type="submit"
            variant="primary"
            loading={isSubmitting || loading}
            disabled={isSubmitting || loading}
          >
            {project ? 'Update Project' : 'Create Project'}
          </Button>
          
          {onCancel && (
            <Button
              type="button"
              variant="secondary"
              onClick={onCancel}
              disabled={isSubmitting || loading}
            >
              Cancel
            </Button>
          )}
        </div>
      </form>
    </div>
  );
};

export default ProjectForm;
