const { query } = require('../config/database');

// In-memory cache for role-permission mappings
let permissionCache = new Map();

/**
 * Load all role-permission mappings into memory
 * @returns {Promise<void>}
 */
const loadPermissions = async () => {
  try {
    const rolePermissions = await query(`
      SELECT r.id as role_id, r.name as role_name, p.name as permission_name
      FROM roles r
      LEFT JOIN role_permissions rp ON r.id = rp.role_id
      LEFT JOIN permissions p ON rp.permission_id = p.id
    `);

    // Clear existing cache
    permissionCache.clear();

    // Build cache: roleId -> Set of permission names
    rolePermissions.forEach(row => {
      if (!permissionCache.has(row.role_id)) {
        permissionCache.set(row.role_id, new Set());
      }
      if (row.permission_name) {
        permissionCache.get(row.role_id).add(row.permission_name);
      }
    });

    console.log(`✓ Loaded permissions for ${permissionCache.size} roles`);
  } catch (error) {
    console.error('Failed to load permissions:', error);
    throw error;
  }
};

/**
 * Check if a role has a specific permission
 * @param {number} roleId - Role ID
 * @param {string} permission - Permission name
 * @returns {boolean} True if role has permission
 */
const hasPermission = (roleId, permission) => {
  const permissions = permissionCache.get(roleId);
  return permissions ? permissions.has(permission) : false;
};

/**
 * Get all permissions for a role
 * @param {number} roleId - Role ID
 * @returns {Set<string>} Set of permission names
 */
const getRolePermissions = (roleId) => {
  return permissionCache.get(roleId) || new Set();
};

module.exports = {
  loadPermissions,
  hasPermission,
  getRolePermissions
};
