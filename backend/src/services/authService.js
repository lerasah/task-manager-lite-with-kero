const { query } = require('../config/database');
const { comparePassword, hashPassword } = require('../utils/password');
const { generateToken, generateImpersonationToken } = require('../utils/jwt');
const { logImpersonation } = require('./auditService');
const { getRolePermissions } = require('./permissionService');

// Rate limiting storage (in-memory, use Redis in production)
const loginAttempts = new Map();
const RATE_LIMIT_WINDOW = 15 * 60 * 1000; // 15 minutes
const MAX_ATTEMPTS = 5;

/**
 * Check if email has exceeded rate limit
 * @param {string} email - User email
 * @returns {boolean} True if rate limited
 */
const isRateLimited = (email) => {
  const attempts = loginAttempts.get(email);
  if (!attempts) return false;
  
  const now = Date.now();
  const recentAttempts = attempts.filter(timestamp => now - timestamp < RATE_LIMIT_WINDOW);
  
  if (recentAttempts.length >= MAX_ATTEMPTS) {
    return true;
  }
  
  // Update with recent attempts only
  loginAttempts.set(email, recentAttempts);
  return false;
};

/**
 * Record a login attempt
 * @param {string} email - User email
 */
const recordLoginAttempt = (email) => {
  const attempts = loginAttempts.get(email) || [];
  attempts.push(Date.now());
  loginAttempts.set(email, attempts);
};

/**
 * Clear login attempts for an email
 * @param {string} email - User email
 */
const clearLoginAttempts = (email) => {
  loginAttempts.delete(email);
};

/**
 * Authenticate user with email and password
 * @param {string} email - User email
 * @param {string} password - User password
 * @returns {Promise<{token: string, user: object}>}
 * @throws {Error} If authentication fails
 */
const login = async (email, password) => {
  // Check rate limit
  if (isRateLimited(email)) {
    throw new Error('Too many login attempts. Please try again in 15 minutes');
  }

  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    recordLoginAttempt(email);
    throw new Error('Invalid email format');
  }

  // Validate password length
  if (password.length < 8) {
    recordLoginAttempt(email);
    throw new Error('Password must be at least 8 characters');
  }

  // Find user by email with role name
  const users = await query(
    `SELECT u.id, u.name, u.email, u.password_hash, u.role_id, u.is_active, r.name as role_name 
     FROM users u 
     LEFT JOIN roles r ON u.role_id = r.id 
     WHERE u.email = ?`,
    [email]
  );

  if (users.length === 0) {
    recordLoginAttempt(email);
    throw new Error('Invalid credentials');
  }

  const user = users[0];

  // Check if user is active
  if (!user.is_active) {
    recordLoginAttempt(email);
    throw new Error('Account is inactive');
  }

  // Compare password
  const isValid = await comparePassword(password, user.password_hash);
  if (!isValid) {
    recordLoginAttempt(email);
    throw new Error('Invalid credentials');
  }

  // Clear login attempts on successful login
  clearLoginAttempts(email);

  // Generate token
  const token = generateToken(user.id, user.role_id);

  // Get user permissions
  const permissions = getRolePermissions(user.role_id);
  const permissionsArray = Array.from(permissions);

  // Return token and user data (without password hash)
  return {
    token,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role_id: user.role_id,
      role_name: user.role_name,
      permissions: permissionsArray
    }
  };
};

module.exports = {
  login
};

/**
 * Register a new user
 * @param {string} name - User name
 * @param {string} email - User email
 * @param {string} password - User password
 * @param {number} roleId - Role ID
 * @returns {Promise<object>} Created user
 * @throws {Error} If registration fails
 */
const register = async (name, email, password, roleId) => {
  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    throw new Error('Invalid email format');
  }

  // Validate password length
  if (password.length < 8) {
    throw new Error('Password must be at least 8 characters');
  }

  // Check if email already exists
  const existing = await query('SELECT id FROM users WHERE email = ?', [email]);
  if (existing.length > 0) {
    throw new Error('Email already exists');
  }

  // Hash password
  const passwordHash = await hashPassword(password);

  // Insert user
  const result = await query(
    'INSERT INTO users (name, email, password_hash, role_id) VALUES (?, ?, ?, ?)',
    [name, email, passwordHash, roleId]
  );

  // Return created user
  return {
    id: result.insertId,
    name,
    email,
    role_id: roleId
  };
};

module.exports = {
  login,
  register
};

/**
 * Create impersonation token for admin to impersonate another user
 * @param {number} adminId - Admin user ID
 * @param {number} targetUserId - Target user ID to impersonate
 * @returns {Promise<{token: string, impersonatedUser: object}>}
 * @throws {Error} If impersonation fails
 */
const impersonate = async (adminId, targetUserId) => {
  // Get target user with role name
  const users = await query(
    `SELECT u.id, u.name, u.email, u.role_id, u.is_active, r.name as role_name 
     FROM users u 
     LEFT JOIN roles r ON u.role_id = r.id 
     WHERE u.id = ?`,
    [targetUserId]
  );

  if (users.length === 0) {
    throw new Error('Target user not found');
  }

  const targetUser = users[0];

  if (!targetUser.is_active) {
    throw new Error('Cannot impersonate inactive user');
  }

  // Generate impersonation token
  const token = generateImpersonationToken(adminId, targetUser.id, targetUser.role_id);

  // Log impersonation action
  await logImpersonation(adminId, targetUser.id);

  // Get user permissions
  const permissions = getRolePermissions(targetUser.role_id);
  const permissionsArray = Array.from(permissions);

  return {
    token,
    impersonatedUser: {
      id: targetUser.id,
      name: targetUser.name,
      email: targetUser.email,
      role_id: targetUser.role_id,
      role_name: targetUser.role_name,
      permissions: permissionsArray
    }
  };
};

/**
 * Exit impersonation and return to admin user
 * @param {number} adminId - Admin user ID
 * @returns {Promise<{token: string}>}
 */
const exitImpersonation = async (adminId) => {
  // Get admin user
  const users = await query(
    'SELECT id, role_id FROM users WHERE id = ?',
    [adminId]
  );

  if (users.length === 0) {
    throw new Error('Admin user not found');
  }

  const admin = users[0];

  // Generate regular token for admin
  const token = generateToken(admin.id, admin.role_id);

  return { token };
};

module.exports = {
  login,
  register,
  impersonate,
  exitImpersonation
};
