const express = require('express');
const { authenticate, requirePermission } = require('../middleware/auth');
const { getAuditLogs } = require('../services/auditService');

const router = express.Router();

/**
 * GET /audit-logs
 * Get audit logs with pagination
 */
router.get('/', authenticate, requirePermission('view_audit_logs'), async (req, res, next) => {
  try {
    const limit = parseInt(req.query.limit) || 50;
    const offset = parseInt(req.query.offset) || 0;

    const logs = await getAuditLogs(limit, offset);

    res.status(200).json({
      success: true,
      data: { logs, total: logs.length },
      message: 'Audit logs retrieved successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
