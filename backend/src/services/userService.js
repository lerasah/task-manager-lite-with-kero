const { query } = require('../config/database');
const { hashPassword } = require('../utils/password');

/**
 * Create a new user
 * @param {string} name - User name
 * @param {string} email - User email
 * @param {string} password - User password
 * @param {number} roleId - Role ID
 * @returns {Promise<object>} Created user
 */
const createUser = async (name, email, password, roleId) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    throw new Error('Invalid email format');
  }

  if (password.length < 8) {
    throw new Error('Password must be at least 8 characters');
  }

  const existing = await query('SELECT id FROM users WHERE email = ?', [email]);
  if (existing.length > 0) {
    throw new Error('Email already exists');
  }

  const passwordHash = await hashPassword(password);
  const result = await query(
    'INSERT INTO users (name, email, password_hash, role_id) VALUES (?, ?, ?, ?)',
    [name, email, passwordHash, roleId]
  );

  return {
    id: result.insertId,
    name,
    email,
    role_id: roleId,
    is_active: true
  };
};

/**
 * Get user by ID
 * @param {number} id - User ID
 * @returns {Promise<object|null>} User or null
 */
const getUserById = async (id) => {
  const users = await query(
    'SELECT id, name, email, role_id, is_active, created_at, updated_at FROM users WHERE id = ?',
    [id]
  );
  return users.length > 0 ? users[0] : null;
};

/**
 * Get user by email
 * @param {string} email - User email
 * @returns {Promise<object|null>} User or null
 */
const getUserByEmail = async (email) => {
  const users = await query(
    'SELECT id, name, email, role_id, is_active, created_at, updated_at FROM users WHERE email = ?',
    [email]
  );
  return users.length > 0 ? users[0] : null;
};

/**
 * Update user
 * @param {number} id - User ID
 * @param {object} data - Update data (name, email, role_id, is_active)
 * @returns {Promise<object>} Updated user
 */
const updateUser = async (id, data) => {
  const { name, email, role_id, is_active } = data;
  const updates = [];
  const values = [];

  if (name !== undefined) {
    updates.push('name = ?');
    values.push(name);
  }

  if (email !== undefined) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      throw new Error('Invalid email format');
    }

    const existing = await query('SELECT id FROM users WHERE email = ? AND id != ?', [email, id]);
    if (existing.length > 0) {
      throw new Error('Email already exists');
    }

    updates.push('email = ?');
    values.push(email);
  }

  if (role_id !== undefined) {
    updates.push('role_id = ?');
    values.push(role_id);
  }

  if (is_active !== undefined) {
    updates.push('is_active = ?');
    values.push(is_active);
  }

  if (updates.length === 0) {
    throw new Error('No fields to update');
  }

  values.push(id);
  await query(`UPDATE users SET ${updates.join(', ')} WHERE id = ?`, values);

  return await getUserById(id);
};

/**
 * Soft delete user (set is_active to false)
 * @param {number} id - User ID
 * @returns {Promise<void>}
 */
const deleteUser = async (id) => {
  await query('UPDATE users SET is_active = false WHERE id = ?', [id]);
};

/**
 * List users
 * @param {boolean} includeInactive - Include inactive users
 * @returns {Promise<Array>} List of users
 */
const listUsers = async (includeInactive = false) => {
  let sql = `
    SELECT u.id, u.name, u.email, u.role_id, u.is_active, u.created_at, u.updated_at, r.name as role_name
    FROM users u
    LEFT JOIN roles r ON u.role_id = r.id
  `;

  if (!includeInactive) {
    sql += ' WHERE u.is_active = true';
  }

  sql += ' ORDER BY u.created_at DESC';

  return await query(sql);
};

/**
 * Restore soft-deleted user
 * @param {number} id - User ID
 * @returns {Promise<object>} Restored user
 */
const restoreUser = async (id) => {
  await query('UPDATE users SET is_active = true WHERE id = ?', [id]);
  return await getUserById(id);
};

module.exports = {
  createUser,
  getUserById,
  getUserByEmail,
  updateUser,
  deleteUser,
  listUsers,
  restoreUser
};
