const express = require('express');
const { login, register, impersonate, exitImpersonation } = require('../services/authService');
const { requestPasswordReset, resetPassword } = require('../services/passwordResetService');
const { authenticate, requirePermission } = require('../middleware/auth');

const router = express.Router();

/**
 * POST /auth/login
 * Authenticate user and return JWT token
 */
router.post('/login', async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Email and password are required',
        timestamp: new Date().toISOString()
      });
    }

    const result = await login(email, password);

    res.status(200).json({
      success: true,
      data: result,
      message: 'Login successful',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    if (error.message.includes('rate limit') || error.message.includes('Too many')) {
      return res.status(429).json({
        success: false,
        error: error.message,
        timestamp: new Date().toISOString()
      });
    }
    
    if (error.message.includes('Invalid') || error.message.includes('inactive')) {
      return res.status(401).json({
        success: false,
        error: error.message,
        timestamp: new Date().toISOString()
      });
    }

    next(error);
  }
});

module.exports = router;

/**
 * POST /auth/register
 * Register a new user
 */
router.post('/register', async (req, res, next) => {
  try {
    const { name, email, password, role_id } = req.body;

    if (!name || !email || !password || !role_id) {
      return res.status(400).json({
        success: false,
        error: 'Name, email, password, and role_id are required',
        timestamp: new Date().toISOString()
      });
    }

    const user = await register(name, email, password, role_id);

    res.status(201).json({
      success: true,
      data: { user },
      message: 'User registered successfully',
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
 * POST /auth/impersonate
 * Admin impersonates another user
 */
router.post('/impersonate', authenticate, requirePermission('impersonate_user'), async (req, res, next) => {
  try {
    const { target_user_id } = req.body;
    const adminId = req.user?.id; // Will be set by auth middleware

    if (!target_user_id) {
      return res.status(400).json({
        success: false,
        error: 'target_user_id is required',
        timestamp: new Date().toISOString()
      });
    }

    if (!adminId) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required',
        timestamp: new Date().toISOString()
      });
    }

    const result = await impersonate(adminId, target_user_id);

    res.status(200).json({
      success: true,
      data: result,
      message: 'Impersonation started',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    if (error.message.includes('not found') || error.message.includes('inactive')) {
      return res.status(404).json({
        success: false,
        error: error.message,
        timestamp: new Date().toISOString()
      });
    }

    next(error);
  }
});

/**
 * POST /auth/exit-impersonation
 * Exit impersonation and return to admin user
 */
router.post('/exit-impersonation', authenticate, async (req, res, next) => {
  try {
    const adminId = req.user?.original_admin_id; // From impersonation token

    if (!adminId) {
      return res.status(400).json({
        success: false,
        error: 'Not in impersonation session',
        timestamp: new Date().toISOString()
      });
    }

    const result = await exitImpersonation(adminId);

    res.status(200).json({
      success: true,
      data: result,
      message: 'Impersonation ended',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /auth/request-reset
 * Request password reset
 */
router.post('/request-reset', async (req, res, next) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        error: 'Email is required',
        timestamp: new Date().toISOString()
      });
    }

    await requestPasswordReset(email);

    // Always return success to prevent email enumeration
    res.status(200).json({
      success: true,
      message: 'If the email exists, a password reset link has been sent',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /auth/reset-password
 * Reset password using token
 */
router.post('/reset-password', async (req, res, next) => {
  try {
    const { token, new_password } = req.body;

    if (!token || !new_password) {
      return res.status(400).json({
        success: false,
        error: 'Token and new_password are required',
        timestamp: new Date().toISOString()
      });
    }

    await resetPassword(token, new_password);

    res.status(200).json({
      success: true,
      message: 'Password reset successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    if (error.message.includes('Invalid') || error.message.includes('expired') || error.message.includes('must be')) {
      return res.status(400).json({
        success: false,
        error: error.message,
        timestamp: new Date().toISOString()
      });
    }
    next(error);
  }
});
