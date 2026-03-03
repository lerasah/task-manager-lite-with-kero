const { query } = require('../config/database');

const VALID_STATUSES = ['todo', 'in_progress', 'done'];

/**
 * Create a new task
 * @param {number} projectId - Project ID
 * @param {number} userId - Creator user ID
 * @param {object} data - Task data (title, description, assigned_to)
 * @returns {Promise<object>} Created task
 */
const createTask = async (projectId, userId, data) => {
  const { title, description, assigned_to } = data;

  if (!title) {
    throw new Error('Title is required');
  }

  const result = await query(
    'INSERT INTO tasks (project_id, title, description, status, assigned_to, created_by) VALUES (?, ?, ?, ?, ?, ?)',
    [projectId, title, description || '', 'todo', assigned_to || null, userId]
  );

  return {
    id: result.insertId,
    project_id: projectId,
    title,
    description: description || '',
    status: 'todo',
    assigned_to: assigned_to || null,
    created_by: userId
  };
};

/**
 * Get task by ID
 * @param {number} id - Task ID
 * @returns {Promise<object|null>} Task or null
 */
const getTaskById = async (id) => {
  const tasks = await query(
    `SELECT t.*, 
            u1.name as creator_name,
            u2.name as assignee_name
     FROM tasks t
     LEFT JOIN users u1 ON t.created_by = u1.id
     LEFT JOIN users u2 ON t.assigned_to = u2.id
     WHERE t.id = ?`,
    [id]
  );
  return tasks.length > 0 ? tasks[0] : null;
};

/**
 * List tasks for a project with optional filtering
 * @param {number} projectId - Project ID
 * @param {object} filters - Filters (status, assigned_to)
 * @returns {Promise<Array>} List of tasks
 */
const listTasks = async (projectId, filters = {}) => {
  let sql = `
    SELECT t.*, 
           u1.name as creator_name,
           u2.name as assignee_name
    FROM tasks t
    LEFT JOIN users u1 ON t.created_by = u1.id
    LEFT JOIN users u2 ON t.assigned_to = u2.id
    WHERE t.project_id = ?
  `;
  const params = [projectId];

  // Filter by status (can be array or single value)
  if (filters.status) {
    const statuses = Array.isArray(filters.status) ? filters.status : [filters.status];
    const placeholders = statuses.map(() => '?').join(',');
    sql += ` AND t.status IN (${placeholders})`;
    params.push(...statuses);
  }

  // Filter by assignee
  if (filters.assigned_to) {
    sql += ' AND t.assigned_to = ?';
    params.push(filters.assigned_to);
  }

  sql += ' ORDER BY t.created_at DESC';

  return await query(sql, params);
};

/**
 * Update task
 * @param {number} id - Task ID
 * @param {object} data - Update data (title, description, status, assigned_to)
 * @returns {Promise<object>} Updated task
 */
const updateTask = async (id, data) => {
  const { title, description, status, assigned_to } = data;
  const updates = [];
  const values = [];

  if (title !== undefined) {
    updates.push('title = ?');
    values.push(title);
  }

  if (description !== undefined) {
    updates.push('description = ?');
    values.push(description);
  }

  if (status !== undefined) {
    if (!VALID_STATUSES.includes(status)) {
      throw new Error(`Invalid status. Must be one of: ${VALID_STATUSES.join(', ')}`);
    }
    updates.push('status = ?');
    values.push(status);
  }

  if (assigned_to !== undefined) {
    updates.push('assigned_to = ?');
    values.push(assigned_to);
  }

  if (updates.length === 0) {
    throw new Error('No fields to update');
  }

  values.push(id);
  await query(`UPDATE tasks SET ${updates.join(', ')} WHERE id = ?`, values);

  return await getTaskById(id);
};

/**
 * Delete task
 * @param {number} id - Task ID
 * @returns {Promise<void>}
 */
const deleteTask = async (id) => {
  await query('DELETE FROM tasks WHERE id = ?', [id]);
};

/**
 * Get project ID for a task
 * @param {number} taskId - Task ID
 * @returns {Promise<number|null>} Project ID or null
 */
const getTaskProjectId = async (taskId) => {
  const result = await query('SELECT project_id FROM tasks WHERE id = ?', [taskId]);
  return result.length > 0 ? result[0].project_id : null;
};

module.exports = {
  createTask,
  getTaskById,
  listTasks,
  updateTask,
  deleteTask,
  getTaskProjectId,
  VALID_STATUSES
};
