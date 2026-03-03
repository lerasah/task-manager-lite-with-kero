const express = require('express');
const { authenticate, requirePermission } = require('../middleware/auth');
const { hasPermission } = require('../services/permissionService');
const {
  createProject,
  getProjectById,
  listProjects,
  updateProject,
  deleteProject,
  addUserToProject,
  removeUserFromProject,
  getProjectMembers,
  isUserAssigned,
  isProjectOwner
} = require('../services/projectService');

const router = express.Router();

/**
 * GET /projects
 * List projects (all or assigned based on permissions)
 */
router.get('/', authenticate, async (req, res, next) => {
  try {
    const userId = req.user.user_id;
    const hasViewAll = hasPermission(req.user.role_id, 'view_all_projects');

    const projects = await listProjects(userId, hasViewAll);

    res.status(200).json({
      success: true,
      data: { projects },
      message: 'Projects retrieved successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /projects/:id
 * Get project by ID
 */
router.get('/:id', authenticate, async (req, res, next) => {
  try {
    const projectId = parseInt(req.params.id);
    const userId = req.user.user_id;
    const hasViewAll = hasPermission(req.user.role_id, 'view_all_projects');

    const project = await getProjectById(projectId);

    if (!project) {
      return res.status(404).json({
        success: false,
        error: 'Project not found',
        timestamp: new Date().toISOString()
      });
    }

    // Check access
    if (!hasViewAll) {
      const assigned = await isUserAssigned(projectId, userId);
      if (!assigned) {
        return res.status(403).json({
          success: false,
          error: 'Permission denied: You are not assigned to this project',
          timestamp: new Date().toISOString()
        });
      }
    }

    // Get members
    const members = await getProjectMembers(projectId);
    project.members = members;

    res.status(200).json({
      success: true,
      data: { project },
      message: 'Project retrieved successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /projects
 * Create a new project
 */
router.post('/', authenticate, requirePermission('create_project'), async (req, res, next) => {
  try {
    const { name, description } = req.body;

    if (!name) {
      return res.status(400).json({
        success: false,
        error: 'Name is required',
        timestamp: new Date().toISOString()
      });
    }

    const project = await createProject(req.user.user_id, name, description || '');

    res.status(201).json({
      success: true,
      data: { project },
      message: 'Project created successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    next(error);
  }
});

/**
 * PUT /projects/:id
 * Update project
 */
router.put('/:id', authenticate, async (req, res, next) => {
  try {
    const projectId = parseInt(req.params.id);
    const userId = req.user.user_id;
    const { name, description } = req.body;

    // Check if user is owner or has update_any_project permission
    const isOwner = await isProjectOwner(projectId, userId);
    const hasUpdateAny = hasPermission(req.user.role_id, 'update_any_project');

    if (!isOwner && !hasUpdateAny) {
      return res.status(403).json({
        success: false,
        error: 'Permission denied: Only project owner or users with update_any_project permission can update',
        timestamp: new Date().toISOString()
      });
    }

    const project = await updateProject(projectId, { name, description });

    res.status(200).json({
      success: true,
      data: { project },
      message: 'Project updated successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    if (error.message.includes('No fields')) {
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
 * DELETE /projects/:id
 * Delete project
 */
router.delete('/:id', authenticate, async (req, res, next) => {
  try {
    const projectId = parseInt(req.params.id);
    const userId = req.user.user_id;

    // Check if user is owner or has delete_any_project permission
    const isOwner = await isProjectOwner(projectId, userId);
    const hasDeleteAny = hasPermission(req.user.role_id, 'delete_any_project');

    if (!isOwner && !hasDeleteAny) {
      return res.status(403).json({
        success: false,
        error: 'Permission denied: Only project owner or users with delete_any_project permission can delete',
        timestamp: new Date().toISOString()
      });
    }

    await deleteProject(projectId);

    res.status(200).json({
      success: true,
      message: 'Project deleted successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /projects/:id/members
 * Add member to project
 */
router.post('/:id/members', authenticate, async (req, res, next) => {
  try {
    const projectId = parseInt(req.params.id);
    const userId = req.user.user_id;
    const { user_id, role_in_project } = req.body;

    if (!user_id) {
      return res.status(400).json({
        success: false,
        error: 'user_id is required',
        timestamp: new Date().toISOString()
      });
    }

    // Check if user is owner
    const isOwner = await isProjectOwner(projectId, userId);

    if (!isOwner) {
      return res.status(403).json({
        success: false,
        error: 'Permission denied: Only project owner can add members',
        timestamp: new Date().toISOString()
      });
    }

    await addUserToProject(projectId, user_id, role_in_project || 'member');

    res.status(201).json({
      success: true,
      message: 'Member added successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({
        success: false,
        error: 'User is already a member of this project',
        timestamp: new Date().toISOString()
      });
    }
    next(error);
  }
});

/**
 * DELETE /projects/:id/members/:user_id
 * Remove member from project
 */
router.delete('/:id/members/:user_id', authenticate, async (req, res, next) => {
  try {
    const projectId = parseInt(req.params.id);
    const userId = req.user.user_id;
    const targetUserId = parseInt(req.params.user_id);

    // Check if user is owner
    const isOwner = await isProjectOwner(projectId, userId);

    if (!isOwner) {
      return res.status(403).json({
        success: false,
        error: 'Permission denied: Only project owner can remove members',
        timestamp: new Date().toISOString()
      });
    }

    await removeUserFromProject(projectId, targetUserId);

    res.status(200).json({
      success: true,
      message: 'Member removed successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
