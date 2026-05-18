const express = require('express');
const auth = require('../../middleware/auth');
const activityLogController = require('./activityLog.controller');

const router = express.Router();

router.use(auth);

// ── ActivityLog Routes ─────────────────────────────────────────────────────────
//
// GET /api/activity/:entity_type/:entity_id  → all logs for a specific entity
//   Examples:
//     GET /api/activity/task/64abc...        → logs for a task
//     GET /api/activity/project/64abc...     → logs for a project
//
// GET /api/activity/user/:userId             → all actions by a specific user

router.get('/user/:userId',                 activityLogController.getLogsByUser);
router.get('/:entity_type/:entity_id',      activityLogController.getLogsByEntity);

module.exports = router;