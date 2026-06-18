import express from 'express';
import auth from '../../middleware/auth.js';
import {
    getRecentActivities,
    markAsRead,
    markAllAsRead,
    markManyAsRead
} from './activityLog.controller.js';

const router = express.Router();

router.use(auth);

// GET  /api/activities              → full activity feed + stats for dashboard
// GET  /api/activities?limit=10     → paginated
// GET  /api/activities?page=2       → page 2

router.get('/',                 getRecentActivities);

// PATCH /api/activities/:id/read    → mark single as read (clears NEW badge)
router.patch('/:id/read',       markAsRead);

// POST  /api/activities/read-all    → mark ALL as read
router.post('/read-all',        markAllAsRead);

// POST  /api/activities/read-many   → mark selected IDs as read
// Body: { "ids": ["id1", "id2"] }
router.post('/read-many',       markManyAsRead);

export default router;