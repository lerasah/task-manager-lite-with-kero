const crypto = require('crypto');
const { query } = require('../config/database');
const { hashPassword } = require('../utils/password');

/**
 * Generate a password reset token
 * @param {string} email - User email
 * @returns {Promise<string>} Reset token
 */
const requestPasswordReset = async (email) => {
  // Find user by email
  const users = await query('SELECT id FROM users WHERE email = ?', [email]);

  if (users.length === 0) {
    // Don't reveal if email exists
    return null;
  }

  const userId = users[0].id;

  // Generate random token
  const token = crypto.randomBytes(32).toString('hex');
  const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

  // Set expiration to 1 hour from now
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000);

  // Store token hash in database
  await query(
    'INSERT INTO password_reset_tokens (user_id, token_hash, expires_at) VALUES (?, ?, ?)',
    [userId, tokenHash, expiresAt]
  );

  return token;
};

/**
 * Reset password using token
 * @param {string} token - Reset token
 * @param {string} newPassword - New password
 * @returns {Promise<void>}
 */
const resetPassword = async (token, newPassword) => {
  if (newPassword.length < 8) {
    throw new Error('Password must be at least 8 characters');
  }

  // Hash the token to compare with stored hash
  const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

  // Find valid token
  const tokens = await query(
    `SELECT id, user_id, expires_at, used 
     FROM password_reset_tokens 
     WHERE token_hash = ? AND used = false`,
    [tokenHash]
  );

  if (tokens.length === 0) {
    throw new Error('Invalid or expired reset token');
  }

  const resetToken = tokens[0];

  // Check if token is expired
  if (new Date() > new Date(resetToken.expires_at)) {
    throw new Error('Reset token has expired');
  }

  // Hash new password
  const passwordHash = await hashPassword(newPassword);

  // Update user password
  await query(
    'UPDATE users SET password_hash = ? WHERE id = ?',
    [passwordHash, resetToken.user_id]
  );

  // Mark token as used
  await query(
    'UPDATE password_reset_tokens SET used = true WHERE id = ?',
    [resetToken.id]
  );
};

module.exports = {
  requestPasswordReset,
  resetPassword
};
