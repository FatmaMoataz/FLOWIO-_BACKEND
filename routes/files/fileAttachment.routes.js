const express = require('express');
const auth = require('../../middleware/auth');
const upload = require('../../middleware/upload');
const fileController = require('./fileAttachment.controller');

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

module.exports = router;