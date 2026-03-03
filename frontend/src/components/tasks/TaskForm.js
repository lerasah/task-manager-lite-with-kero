import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Input, Textarea, Select, Button, ErrorMessage } from '../common';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { createTask, updateTask, getProject } from '../../services/api';
import './TaskForm.css';

const TaskForm = ({ task = null, projectId: propProjectId, onSubmit, onCancel }) => {
  const { id: paramProjectId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { showSuccess, showError } = useToast();

  const projectId = propProjectId || paramProjectId;

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    status: 'todo',
    assigned_to: ''
  });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loading, setLoading] = useState(false);
  const [projectMembers, setProjectMembers] = useState([]);
  const [canEditAllFields, setCanEditAllFields] = useState(false);
  const [canOnlyEditStatus, setCanOnlyEditStatus] = useState(false);
  const [hasAssignPermission, setHasAssignPermission] = useState(false);

  // Status options
  const statusOptions = [
    { value: 'todo', label: 'To Do' },
    { value: 'in_progress', label: 'In Progress' },
    { value: 'done', label: 'Done' }
  ];

  // Load project members and determine permissions
  useEffect(() => {
    const loadProjectData = async () => {
      if (!projectId) return;

      try {
        setLoading(true);
        const response = await getProject(projectId);
        const projectData = response.data;
        
        // Set project members for assignee dropdown
        setProjectMembers(projectData.members || []);

        // Determine user permissions
        const isOwner = projectData.created_by === user?.id;
        const hasUpdateAny = user?.permissions?.includes('update_any_task') || false;
        const hasAssign = user?.permissions?.includes('assign_task') || false;

        setHasAssignPermission(hasAssign);

        if (task) {
          // Editing existing task
          const isAssignee = task.assigned_to === user?.id;
          
          if (hasUpdateAny || isOwner) {
            setCanEditAllFields(true);
            setCanOnlyEditStatus(false);
          } else if (isAssignee) {
            setCanEditAllFields(false);
            setCanOnlyEditStatus(true);
          }
        } else {
          // Creating new task - user is assigned to project
          setCanEditAllFields(true);
        }

        setLoading(false);
      } catch (err) {
        showError(err.message || 'Failed to load project data');
        setLoading(false);
      }
    };

    loadProjectData();
  }, [projectId, task, user, showError]);

  // Populate form when editing existing task
  useEffect(() => {
    if (task) {
      setFormData({
        title: task.title || '',
        description: task.description || '',
        status: task.status || 'todo',
        assigned_to: task.assigned_to || ''
      });
    }
  }, [task]);

  const validateForm = () => {
    const newErrors = {};

    // Title is required
    if (!formData.title.trim()) {
      newErrors.title = 'Task title is required';
    }

    // Status must be valid
    if (!['todo', 'in_progress', 'done'].includes(formData.status)) {
      newErrors.status = 'Invalid status value';
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
      // Prepare data based on what user can edit
      let dataToSubmit = {};

      if (canOnlyEditStatus) {
        // Task assignee can only update status
        dataToSubmit = { status: formData.status };
      } else if (canEditAllFields) {
        // Can edit all fields
        dataToSubmit = {
          title: formData.title,
          description: formData.description,
          status: formData.status
        };

        // Only include assigned_to if user has permission and field has value
        if (hasAssignPermission && formData.assigned_to) {
          dataToSubmit.assigned_to = parseInt(formData.assigned_to);
        }
      }

      if (task) {
        // Update existing task
        await updateTask(task.id, dataToSubmit);
        showSuccess('Task updated successfully');
        
        if (onSubmit) {
          onSubmit();
        } else {
          navigate(`/tasks/${task.id}`);
        }
      } else {
        // Create new task
        await createTask(projectId, dataToSubmit);
        showSuccess('Task created successfully');
        
        if (onSubmit) {
          onSubmit();
        } else {
          // Navigate to project detail page
          navigate(`/projects/${projectId}`);
        }
      }
    } catch (error) {
      showError(error.message || 'Failed to save task');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancelClick = () => {
    if (onCancel) {
      onCancel();
    } else if (task) {
      navigate(`/tasks/${task.id}`);
    } else {
      navigate(`/projects/${projectId}`);
    }
  };

  // Prepare assignee options
  const assigneeOptions = projectMembers.map(member => ({
    value: member.id,
    label: member.name
  }));

  return (
    <div className="task-form">
      <h2>{task ? 'Edit Task' : 'Create New Task'}</h2>
      
      {loading ? (
        <p>Loading...</p>
      ) : (
        <form onSubmit={handleSubmit}>
          <Input
            label="Task Title"
            name="title"
            value={formData.title}
            onChange={handleChange}
            error={errors.title}
            placeholder="Enter task title"
            required
            disabled={isSubmitting || canOnlyEditStatus}
          />

          <Textarea
            label="Description"
            name="description"
            value={formData.description}
            onChange={handleChange}
            error={errors.description}
            placeholder="Enter task description (optional)"
            rows={5}
            disabled={isSubmitting || canOnlyEditStatus}
          />

          <Select
            label="Status"
            name="status"
            value={formData.status}
            onChange={handleChange}
            options={statusOptions}
            error={errors.status}
            required
            disabled={isSubmitting}
          />

          {canEditAllFields && hasAssignPermission && (
            <Select
              label="Assign To"
              name="assigned_to"
              value={formData.assigned_to}
              onChange={handleChange}
              options={assigneeOptions}
              error={errors.assigned_to}
              placeholder="Select assignee (optional)"
              disabled={isSubmitting}
            />
          )}

          {canOnlyEditStatus && (
            <p className="permission-notice">
              You can only update the status of this task.
            </p>
          )}

          {errors.general && <ErrorMessage message={errors.general} />}

          <div className="form-actions">
            <Button
              type="submit"
              variant="primary"
              loading={isSubmitting}
              disabled={isSubmitting}
            >
              {task ? 'Update Task' : 'Create Task'}
            </Button>
            
            <Button
              type="button"
              variant="secondary"
              onClick={handleCancelClick}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
          </div>
        </form>
      )}
    </div>
  );
};

export default TaskForm;
