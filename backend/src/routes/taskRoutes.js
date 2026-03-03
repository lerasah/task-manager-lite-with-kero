const express = require('express');
const { authenticate } = require('../middleware/auth');
const { hasPermission } = require('../services/permissionService');
const { isUserAssigned, isProjectOwner } = require('../services/projectService');
const {
  createTask,
  getTaskById,
  listTasks,
  updateTask,
  deleteTask,
  getTaskProjectId
} = require('../services/taskService');
const { addComment, getComments } = require('../services/commentService');

const router = express.Router();

/**
 * GET /projects/:projectId/tasks
 * List tasks for a project with optional filtering
 */
router.get('/projects/:projectId/tasks', authenticate, async (req, res, next) => {
  try {
    const projectId = parseInt(req.params.projectId);
    const userId = req.user.user_id;
    const hasViewAll = hasPermission(req.user.role_id, 'view_all_projects');

    // Check access to project
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

    // Parse filters
    const filters = {};
    if (req.query.status) {
      filters.status = req.query.status.includes(',') 
        ? req.query.status.split(',') 
        : req.query.status;
    }
    if (req.query.assigned_to) {
      filters.assigned_to = parseInt(req.query.assigned_to);
    }

    const tasks = await listTasks(projectId, filters);

    res.status(200).json({
      success: true,
      data: { tasks },
      message: 'Tasks retrieved successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /tasks/:id
 * Get task by ID
 */
router.get('/tasks/:id', authenticate, async (req, res, next) => {
  try {
    const taskId = parseInt(req.params.id);
    const userId = req.user.user_id;

    const task = await getTaskById(taskId);

    if (!task) {
      return res.status(404).json({
        success: false,
        error: 'Task not found',
        timestamp: new Date().toISOString()
      });
    }

    // Check access to project
    const hasViewAll = hasPermission(req.user.role_id, 'view_all_projects');
    if (!hasViewAll) {
      const assigned = await isUserAssigned(task.project_id, userId);
      if (!assigned) {
        return res.status(403).json({
          success: false,
          error: 'Permission denied: You are not assigned to this project',
          timestamp: new Date().toISOString()
        });
      }
    }

    res.status(200).json({
      success: true,
      data: { task },
      message: 'Task retrieved successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /projects/:projectId/tasks
 * Create a new task
 */
router.post('/projects/:projectId/tasks', authenticate, async (req, res, next) => {
  try {
    const projectId = parseInt(req.params.projectId);
    const userId = req.user.user_id;
    const { title, description, assigned_to } = req.body;

    // Check if user is assigned to project
    const assigned = await isUserAssigned(projectId, userId);
    if (!assigned) {
      return res.status(403).json({
        success: false,
        error: 'Permission denied: You are not assigned to this project',
        timestamp: new Date().toISOString()
      });
    }

    // If assigning to someone, check assign_task permission
    if (assigned_to) {
      const hasAssignTask = hasPermission(req.user.role_id, 'assign_task');
      if (!hasAssignTask) {
        return res.status(403).json({
          success: false,
          error: 'Permission denied: assign_task required to assign tasks',
          timestamp: new Date().toISOString()
        });
      }

      // Verify assigned user is a project member
      const assigneeIsAssigned = await isUserAssigned(projectId, assigned_to);
      if (!assigneeIsAssigned) {
        return res.status(400).json({
          success: false,
          error: 'Assigned user is not a member of this project',
          timestamp: new Date().toISOString()
        });
      }
    }

    const task = await createTask(projectId, userId, { title, description, assigned_to });

    res.status(201).json({
      success: true,
      data: { task },
      message: 'Task created successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    if (error.message.includes('required')) {
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
 * PUT /tasks/:id
 * Update task
 */
router.put('/tasks/:id', authenticate, async (req, res, next) => {
  try {
    const taskId = parseInt(req.params.id);
    const userId = req.user.user_id;
    const { title, description, status, assigned_to } = req.body;

    const task = await getTaskById(taskId);

    if (!task) {
      return res.status(404).json({
        success: false,
        error: 'Task not found',
        timestamp: new Date().toISOString()
      });
    }

    const projectId = task.project_id;
    const isOwner = await isProjectOwner(projectId, userId);
    const hasUpdateAny = hasPermission(req.user.role_id, 'update_any_task');
    const isAssignee = task.assigned_to === userId;

    // Determine what user can update
    if (hasUpdateAny || isOwner) {
      // Can update all fields
      const updatedTask = await updateTask(taskId, { title, description, status, assigned_to });
      return res.status(200).json({
        success: true,
        data: { task: updatedTask },
        message: 'Task updated successfully',
        timestamp: new Date().toISOString()
      });
    } else if (isAssignee) {
      // Can only update status
      if (title !== undefined || description !== undefined || assigned_to !== undefined) {
        return res.status(403).json({
          success: false,
          error: 'Permission denied: Task assignee can only update status',
          timestamp: new Date().toISOString()
        });
      }
      const updatedTask = await updateTask(taskId, { status });
      return res.status(200).json({
        success: true,
        data: { task: updatedTask },
        message: 'Task updated successfully',
        timestamp: new Date().toISOString()
      });
    } else {
      return res.status(403).json({
        success: false,
        error: 'Permission denied: You cannot update this task',
        timestamp: new Date().toISOString()
      });
    }
  } catch (error) {
    if (error.message.includes('Invalid') || error.message.includes('No fields')) {
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
 * DELETE /tasks/:id
 * Delete task
 */
router.delete('/tasks/:id', authenticate, async (req, res, next) => {
  try {
    const taskId = parseInt(req.params.id);
    const userId = req.user.user_id;

    const projectId = await getTaskProjectId(taskId);

    if (!projectId) {
      return res.status(404).json({
        success: false,
        error: 'Task not found',
        timestamp: new Date().toISOString()
      });
    }

    // Check if user is owner or has update_any_task permission
    const isOwner = await isProjectOwner(projectId, userId);
    const hasUpdateAny = hasPermission(req.user.role_id, 'update_any_task');

    if (!isOwner && !hasUpdateAny) {
      return res.status(403).json({
        success: false,
        error: 'Permission denied: Only project owner or users with update_any_task permission can delete',
        timestamp: new Date().toISOString()
      });
    }

    await deleteTask(taskId);

    res.status(200).json({
      success: true,
      message: 'Task deleted successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;

/**
 * POST /tasks/:id/comments
 * Add a comment to a task
 */
router.post('/tasks/:id/comments', authenticate, async (req, res, next) => {
  try {
    const taskId = parseInt(req.params.id);
    const userId = req.user.user_id;
    const { content } = req.body;

    const task = await getTaskById(taskId);

    if (!task) {
      return res.status(404).json({
        success: false,
        error: 'Task not found',
        timestamp: new Date().toISOString()
      });
    }

    // Check if user is assigned to project
    const assigned = await isUserAssigned(task.project_id, userId);
    if (!assigned) {
      return res.status(403).json({
        success: false,
        error: 'Permission denied: You are not assigned to this project',
        timestamp: new Date().toISOString()
      });
    }

    const comment = await addComment(taskId, userId, content);

    res.status(201).json({
      success: true,
      data: { comment },
      message: 'Comment added successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    if (error.message.includes('required')) {
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
 * GET /tasks/:id/comments
 * Get comments for a task
 */
router.get('/tasks/:id/comments', authenticate, async (req, res, next) => {
  try {
    const taskId = parseInt(req.params.id);
    const userId = req.user.user_id;

    const task = await getTaskById(taskId);

    if (!task) {
      return res.status(404).json({
        success: false,
        error: 'Task not found',
        timestamp: new Date().toISOString()
      });
    }

    // Check if user is assigned to project
    const hasViewAll = hasPermission(req.user.role_id, 'view_all_projects');
    if (!hasViewAll) {
      const assigned = await isUserAssigned(task.project_id, userId);
      if (!assigned) {
        return res.status(403).json({
          success: false,
          error: 'Permission denied: You are not assigned to this project',
          timestamp: new Date().toISOString()
        });
      }
    }

    const comments = await getComments(taskId);

    res.status(200).json({
      success: true,
      data: { comments },
      message: 'Comments retrieved successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    next(error);
  }
});
