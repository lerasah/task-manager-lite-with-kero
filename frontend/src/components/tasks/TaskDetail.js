import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getTask, updateTask, getComments, addComment } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { LoadingSpinner, ErrorMessage, Button, Select, Input } from '../common';
import './TaskDetail.css';

const TaskDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { showToast } = useToast();
  
  const [task, setTask] = useState(null);
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [commentContent, setCommentContent] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);
  const [updatingTask, setUpdatingTask] = useState(false);
  
  // Permission states
  const [canUpdateStatus, setCanUpdateStatus] = useState(false);
  const [canUpdateAllFields, setCanUpdateAllFields] = useState(false);
  const [canComment, setCanComment] = useState(false);
  
  // Edit states
  const [isEditing, setIsEditing] = useState(false);
  const [editedTitle, setEditedTitle] = useState('');
  const [editedDescription, setEditedDescription] = useState('');
  const [editedStatus, setEditedStatus] = useState('');
  const [editedAssignee, setEditedAssignee] = useState('');

  const loadTaskData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch task details
      const taskResponse = await getTask(id);
      const taskData = taskResponse.data;
      setTask(taskData);

      // Fetch comments
      const commentsResponse = await getComments(id);
      setComments(commentsResponse.data || []);

      // Determine permissions
      const isAssignee = taskData.assigned_to === user?.id;
      const isProjectOwner = taskData.project_created_by === user?.id;
      const hasUpdateAnyTask = user?.permissions?.includes('update_any_task') || false;
      
      // Task assignee can update status
      setCanUpdateStatus(isAssignee || isProjectOwner || hasUpdateAnyTask);
      
      // Project owner or update_any_task permission can update all fields
      setCanUpdateAllFields(isProjectOwner || hasUpdateAnyTask);
      
      // Assigned users can comment (check if user is in project members)
      setCanComment(taskData.is_user_assigned || false);

      setLoading(false);
    } catch (err) {
      setError(err.message || 'Failed to load task');
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTaskData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const handleStatusChange = async (newStatus) => {
    try {
      setUpdatingTask(true);
      await updateTask(id, { status: newStatus });
      setTask({ ...task, status: newStatus });
      showToast('Task status updated successfully', 'success');
    } catch (err) {
      showToast(err.message || 'Failed to update task status', 'error');
    } finally {
      setUpdatingTask(false);
    }
  };

  const handleEditClick = () => {
    setEditedTitle(task.title);
    setEditedDescription(task.description || '');
    setEditedStatus(task.status);
    setEditedAssignee(task.assigned_to || '');
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditedTitle('');
    setEditedDescription('');
    setEditedStatus('');
    setEditedAssignee('');
  };

  const handleSaveEdit = async () => {
    if (!editedTitle.trim()) {
      showToast('Task title is required', 'error');
      return;
    }

    try {
      setUpdatingTask(true);
      const updates = {
        title: editedTitle,
        description: editedDescription,
        status: editedStatus
      };
      
      // Only include assignee if it changed
      if (editedAssignee !== task.assigned_to) {
        updates.assigned_to = editedAssignee || null;
      }

      const response = await updateTask(id, updates);
      setTask(response.data);
      setIsEditing(false);
      showToast('Task updated successfully', 'success');
    } catch (err) {
      showToast(err.message || 'Failed to update task', 'error');
    } finally {
      setUpdatingTask(false);
    }
  };

  const handleCommentSubmit = async (e) => {
    e.preventDefault();
    
    if (!commentContent.trim()) {
      showToast('Comment cannot be empty', 'error');
      return;
    }

    try {
      setSubmittingComment(true);
      const response = await addComment(id, commentContent);
      setComments([...comments, response.data]);
      setCommentContent('');
      showToast('Comment added successfully', 'success');
    } catch (err) {
      showToast(err.message || 'Failed to add comment', 'error');
    } finally {
      setSubmittingComment(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'todo':
        return 'status-badge status-todo';
      case 'in_progress':
        return 'status-badge status-in-progress';
      case 'done':
        return 'status-badge status-done';
      default:
        return 'status-badge';
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 'todo':
        return 'To Do';
      case 'in_progress':
        return 'In Progress';
      case 'done':
        return 'Done';
      default:
        return status;
    }
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  if (error) {
    return <ErrorMessage message={error} />;
  }

  if (!task) {
    return <ErrorMessage message="Task not found" />;
  }

  return (
    <div className="task-detail">
      <div className="task-detail-header">
        <Button onClick={() => navigate(-1)} variant="secondary" size="small">
          ← Back
        </Button>
      </div>

      <div className="task-detail-content">
        <div className="task-main">
          {!isEditing ? (
            <>
              <div className="task-title-section">
                <h1>{task.title}</h1>
                {canUpdateAllFields && (
                  <Button onClick={handleEditClick} variant="secondary" size="small">
                    Edit
                  </Button>
                )}
              </div>

              <div className="task-meta-info">
                <div className="meta-item">
                  <span className="meta-label">Status:</span>
                  {canUpdateStatus && !canUpdateAllFields ? (
                    <Select
                      value={task.status}
                      onChange={(e) => handleStatusChange(e.target.value)}
                      disabled={updatingTask}
                      className="status-select"
                    >
                      <option value="todo">To Do</option>
                      <option value="in_progress">In Progress</option>
                      <option value="done">Done</option>
                    </Select>
                  ) : (
                    <span className={getStatusBadgeClass(task.status)}>
                      {getStatusLabel(task.status)}
                    </span>
                  )}
                </div>

                <div className="meta-item">
                  <span className="meta-label">Assignee:</span>
                  <span className="meta-value">{task.assignee_name || 'Unassigned'}</span>
                </div>

                <div className="meta-item">
                  <span className="meta-label">Creator:</span>
                  <span className="meta-value">{task.creator_name || 'Unknown'}</span>
                </div>

                <div className="meta-item">
                  <span className="meta-label">Created:</span>
                  <span className="meta-value">{formatDate(task.created_at)}</span>
                </div>

                <div className="meta-item">
                  <span className="meta-label">Updated:</span>
                  <span className="meta-value">{formatDate(task.updated_at)}</span>
                </div>
              </div>

              <div className="task-description-section">
                <h2>Description</h2>
                <p className="task-description">
                  {task.description || 'No description provided'}
                </p>
              </div>
            </>
          ) : (
            <div className="task-edit-form">
              <h2>Edit Task</h2>
              
              <div className="form-group">
                <label htmlFor="title">Title *</label>
                <Input
                  id="title"
                  value={editedTitle}
                  onChange={(e) => setEditedTitle(e.target.value)}
                  placeholder="Task title"
                  disabled={updatingTask}
                />
              </div>

              <div className="form-group">
                <label htmlFor="description">Description</label>
                <textarea
                  id="description"
                  value={editedDescription}
                  onChange={(e) => setEditedDescription(e.target.value)}
                  placeholder="Task description"
                  disabled={updatingTask}
                  rows="5"
                  className="form-textarea"
                />
              </div>

              <div className="form-group">
                <label htmlFor="status">Status</label>
                <Select
                  id="status"
                  value={editedStatus}
                  onChange={(e) => setEditedStatus(e.target.value)}
                  disabled={updatingTask}
                >
                  <option value="todo">To Do</option>
                  <option value="in_progress">In Progress</option>
                  <option value="done">Done</option>
                </Select>
              </div>

              <div className="form-actions">
                <Button 
                  onClick={handleSaveEdit} 
                  variant="primary"
                  disabled={updatingTask}
                >
                  {updatingTask ? 'Saving...' : 'Save Changes'}
                </Button>
                <Button 
                  onClick={handleCancelEdit} 
                  variant="secondary"
                  disabled={updatingTask}
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}

          <div className="task-comments-section">
            <h2>Comments ({comments.length})</h2>
            
            <div className="comments-list">
              {comments.length === 0 ? (
                <p className="no-comments">No comments yet</p>
              ) : (
                comments.map((comment) => (
                  <div key={comment.id} className="comment">
                    <div className="comment-header">
                      <span className="comment-author">{comment.user_name}</span>
                      <span className="comment-date">{formatDate(comment.created_at)}</span>
                    </div>
                    <p className="comment-content">{comment.content}</p>
                  </div>
                ))
              )}
            </div>

            {canComment && (
              <form onSubmit={handleCommentSubmit} className="comment-form">
                <h3>Add Comment</h3>
                <textarea
                  value={commentContent}
                  onChange={(e) => setCommentContent(e.target.value)}
                  placeholder="Write your comment here..."
                  disabled={submittingComment}
                  rows="4"
                  className="comment-textarea"
                />
                <Button 
                  type="submit" 
                  variant="primary"
                  disabled={submittingComment || !commentContent.trim()}
                >
                  {submittingComment ? 'Posting...' : 'Post Comment'}
                </Button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TaskDetail;
