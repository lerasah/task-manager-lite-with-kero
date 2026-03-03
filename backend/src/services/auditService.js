const { query } = require('../config/database');

/**
 * Log impersonation action
 * @param {number} adminId - Admin user ID
 * @param {number} targetUserId - Target user ID being impersonated
 * @returns {Promise<void>}
 */
const logImpersonation = async (adminId, targetUserId) => {
  await query(
    'INSERT INTO audit_logs (performed_by, action, impersonated_user_id, details) VALUES (?, ?, ?, ?)',
    [adminId, 'impersonate_user', targetUserId, JSON.stringify({ target_user_id: targetUserId })]
  );
};

/**
 * Log user action (create, update, delete)
 * @param {number} adminId - Admin user ID
 * @param {string} action - Action description
 * @param {object} details - Action details
 * @returns {Promise<void>}
 */
const logUserAction = async (adminId, action, details = {}) => {
  await query(
    'INSERT INTO audit_logs (performed_by, action, details) VALUES (?, ?, ?)',
    [adminId, action, JSON.stringify(details)]
  );
};

/**
 * Log permission change action
 * @param {number} adminId - Admin user ID
 * @param {string} action - Action description
 * @param {object} details - Action details
 * @returns {Promise<void>}
 */
const logPermissionChange = async (adminId, action, details = {}) => {
  await query(
    'INSERT INTO audit_logs (performed_by, action, details) VALUES (?, ?, ?)',
    [adminId, action, JSON.stringify(details)]
  );
};

/**
 * Get audit logs with pagination
 * @param {number} limit - Number of logs to return
 * @param {number} offset - Offset for pagination
 * @returns {Promise<Array>} Audit logs
 */
const getAuditLogs = async (limit = 50, offset = 0) => {
  const logs = await query(
    `SELECT al.*, 
            u1.name as performed_by_name,
            u2.name as impersonated_user_name
     FROM audit_logs al
     LEFT JOIN users u1 ON al.performed_by = u1.id
     LEFT JOIN users u2 ON al.impersonated_user_id = u2.id
     ORDER BY al.created_at DESC
     LIMIT ? OFFSET ?`,
    [limit, offset]
  );

  return logs;
};

module.exports = {
  logImpersonation,
  logUserAction,
  logPermissionChange,
  getAuditLogs
};
