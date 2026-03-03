const { query } = require('../config/database');

/**
 * Add a comment to a task
 * @param {number} taskId - Task ID
 * @param {number} userId - User ID
 * @param {string} content - Comment content
 * @returns {Promise<object>} Created comment
 */
const addComment = async (taskId, userId, content) => {
  if (!content || content.trim().length === 0) {
    throw new Error('Comment content is required');
  }

  const result = await query(
    'INSERT INTO comments (task_id, user_id, content) VALUES (?, ?, ?)',
    [taskId, userId, content]
  );

  return {
    id: result.insertId,
    task_id: taskId,
    user_id: userId,
    content,
    created_at: new Date()
  };
};

/**
 * Get comments for a task
 * @param {number} taskId - Task ID
 * @returns {Promise<Array>} List of comments with commenter names
 */
const getComments = async (taskId) => {
  return await query(
    `SELECT c.*, u.name as commenter_name
     FROM comments c
     LEFT JOIN users u ON c.user_id = u.id
     WHERE c.task_id = ?
     ORDER BY c.created_at ASC`,
    [taskId]
  );
};

module.exports = {
  addComment,
  getComments
};
