const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRATION = process.env.JWT_EXPIRATION || '24h';

if (!JWT_SECRET) {
  console.error('Missing required environment variable: JWT_SECRET');
  process.exit(1);
}

/**
 * Generate a JWT token for a user
 * @param {number} userId - User ID
 * @param {number} roleId - Role ID
 * @returns {string} JWT token
 */
const generateToken = (userId, roleId) => {
  return jwt.sign(
    { user_id: userId, role_id: roleId },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRATION }
  );
};

/**
 * Generate an impersonation JWT token
 * @param {number} adminId - Admin user ID
 * @param {number} targetUserId - Target user ID to impersonate
 * @param {number} targetRoleId - Target user's role ID
 * @returns {string} JWT token
 */
const generateImpersonationToken = (adminId, targetUserId, targetRoleId) => {
  return jwt.sign(
    {
      original_admin_id: adminId,
      impersonated_user_id: targetUserId,
      user_id: targetUserId,
      role_id: targetRoleId
    },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRATION }
  );
};

/**
 * Verify and decode a JWT token
 * @param {string} token - JWT token
 * @returns {object} Decoded token payload
 * @throws {Error} If token is invalid or expired
 */
const verifyToken = (token) => {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      throw new Error('Token expired');
    }
    throw new Error('Invalid token');
  }
};

module.exports = {
  generateToken,
  generateImpersonationToken,
  verifyToken
};
