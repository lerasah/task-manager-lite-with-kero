import React, { useState, useEffect } from 'react';
import { getUsers, addProjectMember, removeProjectMember } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { Button, Select, ErrorMessage, LoadingSpinner } from '../common';
import './ProjectMembers.css';

const ProjectMembers = ({ project, onMemberChange }) => {
  const { user } = useAuth();
  const { showToast } = useToast();
  
  const [allUsers, setAllUsers] = useState([]);
  const [selectedUserId, setSelectedUserId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [addingMember, setAddingMember] = useState(false);

  const isProjectOwner = project?.created_by === user?.id;

  useEffect(() => {
    if (isProjectOwner) {
      loadUsers();
    }
  }, [isProjectOwner]);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const response = await getUsers(false);
      setAllUsers(response.data || []);
      setLoading(false);
    } catch (err) {
      setError(err.message || 'Failed to load users');
      setLoading(false);
    }
  };

  const handleAddMember = async (e) => {
    e.preventDefault();
    
    if (!selectedUserId) {
      showToast('Please select a user', 'error');
      return;
    }

    // Check if user is already a member
    const isAlreadyMember = project.members?.some(member => member.id === parseInt(selectedUserId));
    if (isAlreadyMember) {
      showToast('User is already a member of this project', 'error');
      return;
    }

    try {
      setAddingMember(true);
      await addProjectMember(project.id, selectedUserId);
      showToast('Member added successfully', 'success');
      setSelectedUserId('');
      
      // Notify parent to refresh project data
      if (onMemberChange) {
        onMemberChange();
      }
    } catch (err) {
      showToast(err.message || 'Failed to add member', 'error');
    } finally {
      setAddingMember(false);
    }
  };

  const handleRemoveMember = async (memberId) => {
    // Prevent removing the project owner
    if (memberId === project.created_by) {
      showToast('Cannot remove project owner', 'error');
      return;
    }

    if (!window.confirm('Are you sure you want to remove this member from the project?')) {
      return;
    }

    try {
      await removeProjectMember(project.id, memberId);
      showToast('Member removed successfully', 'success');
      
      // Notify parent to refresh project data
      if (onMemberChange) {
        onMemberChange();
      }
    } catch (err) {
      showToast(err.message || 'Failed to remove member', 'error');
    }
  };

  // Get users that are not already members
  const availableUsers = allUsers.filter(
    u => !project.members?.some(member => member.id === u.id)
  );

  const userOptions = availableUsers.map(u => ({
    value: u.id.toString(),
    label: `${u.name} (${u.email})`
  }));

  if (!project) {
    return null;
  }

  return (
    <div className="project-members">
      <h2>Project Members</h2>
      
      {error && <ErrorMessage message={error} />}
      
      <div className="members-list">
        {project.members && project.members.length > 0 ? (
          <ul className="member-items">
            {project.members.map(member => (
              <li key={member.id} className="member-item">
                <div className="member-info">
                  <span className="member-name">{member.name}</span>
                  <span className="member-email">{member.email}</span>
                  {member.id === project.created_by && (
                    <span className="member-badge owner-badge">Owner</span>
                  )}
                </div>
                {isProjectOwner && member.id !== project.created_by && (
                  <Button
                    onClick={() => handleRemoveMember(member.id)}
                    variant="danger"
                    size="small"
                  >
                    Remove
                  </Button>
                )}
              </li>
            ))}
          </ul>
        ) : (
          <p className="empty-message">No members assigned to this project</p>
        )}
      </div>

      {isProjectOwner && (
        <div className="add-member-section">
          <h3>Add Member</h3>
          {loading ? (
            <LoadingSpinner />
          ) : (
            <form onSubmit={handleAddMember} className="add-member-form">
              <Select
                label="Select User"
                name="user"
                value={selectedUserId}
                onChange={(e) => setSelectedUserId(e.target.value)}
                options={userOptions}
                placeholder="Choose a user to add"
                required
              />
              <Button
                type="submit"
                variant="primary"
                disabled={addingMember || !selectedUserId}
              >
                {addingMember ? 'Adding...' : 'Add Member'}
              </Button>
            </form>
          )}
        </div>
      )}
    </div>
  );
};

export default ProjectMembers;
