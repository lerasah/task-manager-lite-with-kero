const { verifyToken } = require('../utils/jwt');
const { hasPermission } = require('../services/permissionService');

/**
 * Middleware to authenticate requests using JWT token
 * Attaches user data to req.user
 */
const authenticate = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required',
        timestamp: new Date().toISOString()
      });
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix
    const decoded = verifyToken(token);

    // Attach user data to request
    req.user = decoded;

    next();
  } catch (error) {
    if (error.message === 'Token expired') {
      return res.status(401).json({
        success: false,
        error: 'Token expired',
        timestamp: new Date().toISOString()
      });
    }

    return res.status(401).json({
      success: false,
      error: 'Invalid token',
      timestamp: new Date().toISOString()
    });
  }
};

/**
 * Middleware factory to check if user has required permission
 * @param {string} permission - Required permission name
 * @returns {Function} Express middleware
 */
const requirePermission = (permission) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required',
        timestamp: new Date().toISOString()
      });
    }

    // Use role_id from token (handles impersonation automatically)
    const roleId = req.user.role_id;

    if (!hasPermission(roleId, permission)) {
      return res.status(403).json({
        success: false,
        error: `Permission denied: ${permission} required`,
        timestamp: new Date().toISOString()
      });
    }

    next();
  };
};

module.exports = {
  authenticate,
  requirePermission
};
