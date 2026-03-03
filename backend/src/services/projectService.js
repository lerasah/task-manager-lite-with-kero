const { query } = require('../config/database');

/**
 * Create a new project
 * @param {number} userId - Creator user ID
 * @param {string} name - Project name
 * @param {string} description - Project description
 * @returns {Promise<object>} Created project
 */
const createProject = async (userId, name, description) => {
  const result = await query(
    'INSERT INTO projects (name, description, created_by) VALUES (?, ?, ?)',
    [name, description, userId]
  );

  // Automatically add creator to project members
  await query(
    'INSERT INTO project_users (project_id, user_id, role_in_project) VALUES (?, ?, ?)',
    [result.insertId, userId, 'owner']
  );

  return {
    id: result.insertId,
    name,
    description,
    created_by: userId
  };
};

/**
 * Get project by ID
 * @param {number} id - Project ID
 * @returns {Promise<object|null>} Project or null
 */
const getProjectById = async (id) => {
  const projects = await query(
    `SELECT p.*, u.name as creator_name,
            (SELECT COUNT(*) FROM tasks WHERE project_id = p.id) as task_count
     FROM projects p
     LEFT JOIN users u ON p.created_by = u.id
     WHERE p.id = ? AND p.deleted_at IS NULL`,
    [id]
  );
  return projects.length > 0 ? projects[0] : null;
};

/**
 * List projects for a user
 * @param {number} userId - User ID
 * @param {boolean} hasViewAll - Whether user has view_all_projects permission
 * @returns {Promise<Array>} List of projects
 */
const listProjects = async (userId, hasViewAll) => {
  let sql;
  let params;

  if (hasViewAll) {
    // Return all projects
    sql = `
      SELECT p.*, u.name as creator_name,
             (SELECT COUNT(*) FROM tasks WHERE project_id = p.id) as task_count
      FROM projects p
      LEFT JOIN users u ON p.created_by = u.id
      WHERE p.deleted_at IS NULL
      ORDER BY p.updated_at DESC
    `;
    params = [];
  } else {
    // Return only assigned projects
    sql = `
      SELECT p.*, u.name as creator_name,
             (SELECT COUNT(*) FROM tasks WHERE project_id = p.id) as task_count
      FROM projects p
      LEFT JOIN users u ON p.created_by = u.id
      INNER JOIN project_users pu ON p.id = pu.project_id
      WHERE pu.user_id = ? AND p.deleted_at IS NULL
      ORDER BY p.updated_at DESC
    `;
    params = [userId];
  }

  return await query(sql, params);
};

/**
 * Update project
 * @param {number} id - Project ID
 * @param {object} data - Update data (name, description)
 * @returns {Promise<object>} Updated project
 */
const updateProject = async (id, data) => {
  const { name, description } = data;
  const updates = [];
  const values = [];

  if (name !== undefined) {
    updates.push('name = ?');
    values.push(name);
  }

  if (description !== undefined) {
    updates.push('description = ?');
    values.push(description);
  }

  if (updates.length === 0) {
    throw new Error('No fields to update');
  }

  values.push(id);
  await query(`UPDATE projects SET ${updates.join(', ')} WHERE id = ?`, values);

  return await getProjectById(id);
};

/**
 * Soft delete project
 * @param {number} id - Project ID
 * @returns {Promise<void>}
 */
const deleteProject = async (id) => {
  await query('UPDATE projects SET deleted_at = NOW() WHERE id = ?', [id]);
};

/**
 * Add user to project
 * @param {number} projectId - Project ID
 * @param {number} userId - User ID
 * @param {string} roleInProject - Role in project (default: 'member')
 * @returns {Promise<void>}
 */
const addUserToProject = async (projectId, userId, roleInProject = 'member') => {
  await query(
    'INSERT INTO project_users (project_id, user_id, role_in_project) VALUES (?, ?, ?)',
    [projectId, userId, roleInProject]
  );
};

/**
 * Remove user from project
 * @param {number} projectId - Project ID
 * @param {number} userId - User ID
 * @returns {Promise<void>}
 */
const removeUserFromProject = async (projectId, userId) => {
  await query(
    'DELETE FROM project_users WHERE project_id = ? AND user_id = ?',
    [projectId, userId]
  );
};

/**
 * Get project members
 * @param {number} projectId - Project ID
 * @returns {Promise<Array>} List of members
 */
const getProjectMembers = async (projectId) => {
  return await query(
    `SELECT u.id, u.name, u.email, pu.role_in_project
     FROM users u
     INNER JOIN project_users pu ON u.id = pu.user_id
     WHERE pu.project_id = ?
     ORDER BY u.name`,
    [projectId]
  );
};

/**
 * Check if user is assigned to project
 * @param {number} projectId - Project ID
 * @param {number} userId - User ID
 * @returns {Promise<boolean>} True if user is assigned
 */
const isUserAssigned = async (projectId, userId) => {
  const result = await query(
    'SELECT id FROM project_users WHERE project_id = ? AND user_id = ?',
    [projectId, userId]
  );
  return result.length > 0;
};

/**
 * Check if user is project owner
 * @param {number} projectId - Project ID
 * @param {number} userId - User ID
 * @returns {Promise<boolean>} True if user is owner
 */
const isProjectOwner = async (projectId, userId) => {
  const result = await query(
    'SELECT id FROM projects WHERE id = ? AND created_by = ?',
    [projectId, userId]
  );
  return result.length > 0;
};

module.exports = {
  createProject,
  getProjectById,
  listProjects,
  updateProject,
  deleteProject,
  addUserToProject,
  removeUserFromProject,
  getProjectMembers,
  isUserAssigned,
  isProjectOwner
};
