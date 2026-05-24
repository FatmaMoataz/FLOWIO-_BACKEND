const express = require('express');
const router  = express.Router();
const auth    = require('../../middleware/auth');
const archiveController = require('./archive.controller');

// All archive routes require authentication
router.use(auth);

// POST   /api/archive/project/:id    → archive a project
// POST   /api/archive/task/:id       → archive a task
// GET    /api/archive/company/:id    → get all archived items for a company
// DELETE /api/archive/:id            → restore (unarchive) a project or task

router.post('/project/:id',  archiveController.archiveProject);
router.post('/task/:id',     archiveController.archiveTask);
router.get('/company/:id',   archiveController.getArchivedByCompany);
router.delete('/:id',        archiveController.restoreItem);

module.exports = router;