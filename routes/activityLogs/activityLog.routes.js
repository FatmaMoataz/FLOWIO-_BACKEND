import express from 'express';
// إضافة امتداد .js للـ middleware والـ controller
import auth from '../../middleware/auth.js';
import * as activityLogController from './activityLog.controller.js';

const router = express.Router();

router.use(auth);

// ── ActivityLog Routes ─────────────────────────────────────────────────────────
router.get('/user/:userId', activityLogController.getLogsByUser);
router.get('/:entity_type/:entity_id',activityLogController.getLogsByEntity);

export default router;