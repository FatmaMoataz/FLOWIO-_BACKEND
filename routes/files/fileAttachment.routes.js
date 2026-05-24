import express from 'express';
// إضافة امتداد .js للـ middlewares والـ controller إجباري
import auth from '../../middleware/auth.js';
import upload from '../../middleware/upload.js';
import * as fileController from './fileAttachment.controller.js';

const router = express.Router();

router.use(auth);

// ── File Routes ────────────────────────────────────────────────────────────────
//
// POST   /api/files/upload
//   Body (form-data):
//     - file        → the actual file (field name must be 'file')
//     - entity_type → 'task' | 'project' | 'epic' | 'meeting'
//     - entity_id   → MongoDB ObjectId of the entity
//
// GET    /api/files/:entity_type/:entity_id  → get all files for an entity
// DELETE /api/files/:id                      → delete a file

router.post('/upload', upload.single('file'),   fileController.uploadFile);
router.get('/:entity_type/:entity_id',          fileController.getFilesByEntity);
router.delete('/:id',                           fileController.deleteFile);

export default router;