const express = require('express');
const { authenticate, requirePermission } = require('../middleware/auth');
const { createUser, getUserById, updateUser, deleteUser, listUsers, restoreUser } = require('../services/userService');
const { logUserAction } = require('../services/auditService');

const router = express.Router();

/**
 * GET /users
 * List all users
 */
router.get('/', authenticate, requirePermission('view_all_users'), async (req, res, next) => {
  try {
    const includeInactive = req.query.include_inactive === 'true';
    const users = await listUsers(includeInactive);

    res.status(200).json({
      success: true,
      data: { users },
      message: 'Users retrieved successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /users/:id
 * Get user by ID
 */
router.get('/:id', authenticate, async (req, res, next) => {
  try {
    const userId = parseInt(req.params.id);
    const requestingUserId = req.user.user_id;

    // Users can view their own profile, or need view_all_users permission
    if (userId !== requestingUserId && !req.user.hasPermission?.('view_all_users')) {
      // Check permission manually since we can't use middleware here
      const { hasPermission } = require('../services/permissionService');
      if (!hasPermission(req.user.role_id, 'view_all_users')) {
        return res.status(403).json({
          success: false,
          error: 'Permission denied: view_all_users required',
          timestamp: new Date().toISOString()
        });
      }
    }

    const user = await getUserById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found',
        timestamp: new Date().toISOString()
      });
    }

    res.status(200).json({
      success: true,
      data: { user },
      message: 'User retrieved successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /users
 * Create a new user
 */
router.post('/', authenticate, requirePermission('create_user'), async (req, res, next) => {
  try {
    const { name, email, password, role_id } = req.body;

    if (!name || !email || !password || !role_id) {
      return res.status(400).json({
        success: false,
        error: 'Name, email, password, and role_id are required',
        timestamp: new Date().toISOString()
      });
    }

    const user = await createUser(name, email, password, role_id);

    // Log action
    await logUserAction(req.user.user_id, 'create_user', { user_id: user.id, email });

    res.status(201).json({
      success: true,
      data: { user },
      message: 'User created successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    if (error.message.includes('Invalid') || error.message.includes('already exists') || error.message.includes('must be')) {
      return res.status(400).json({
        success: false,
        error: error.message,
        timestamp: new Date().toISOString()
      });
    }
    next(error);
  }
});

/**
 * PUT /users/:id
 * Update user
 */
router.put('/:id', authenticate, requirePermission('update_user'), async (req, res, next) => {
  try {
    const userId = parseInt(req.params.id);
    const { name, email, role_id, is_active } = req.body;

    const user = await updateUser(userId, { name, email, role_id, is_active });

    // Log action
    await logUserAction(req.user.user_id, 'update_user', { user_id: userId, changes: req.body });

    res.status(200).json({
      success: true,
      data: { user },
      message: 'User updated successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    if (error.message.includes('Invalid') || error.message.includes('already exists') || error.message.includes('No fields')) {
      return res.status(400).json({
        success: false,
        error: error.message,
        timestamp: new Date().toISOString()
      });
    }
    next(error);
  }
});

/**
 * DELETE /users/:id
 * Soft delete user
 */
router.delete('/:id', authenticate, requirePermission('delete_user'), async (req, res, next) => {
  try {
    const userId = parseInt(req.params.id);

    await deleteUser(userId);

    // Log action
    await logUserAction(req.user.user_id, 'delete_user', { user_id: userId });

    res.status(200).json({
      success: true,
      message: 'User deleted successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /users/:id/restore
 * Restore soft-deleted user
 */
router.post('/:id/restore', authenticate, requirePermission('restore_deleted_records'), async (req, res, next) => {
  try {
    const userId = parseInt(req.params.id);

    const user = await restoreUser(userId);

    // Log action
    await logUserAction(req.user.user_id, 'restore_user', { user_id: userId });

    res.status(200).json({
      success: true,
      data: { user },
      message: 'User restored successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
