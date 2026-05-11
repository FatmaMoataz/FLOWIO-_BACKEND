const express = require('express');
const auth = require('../../middleware/auth');
const taskController = require('./task.controller');

// mergeParams: true is CRITICAL — it allows this router to access
// req.params.projectId that comes from the parent route in index.js
const router = express.Router({ mergeParams: true });

// All task routes are protected
router.use(auth);

// ── Nested under /api/projects/:projectId/tasks ────────────────────────────────
// POST   /api/projects/:projectId/tasks         → create task in a project
// GET    /api/projects/:projectId/tasks         → get all tasks in a project

router.post('/',   taskController.createTask);
router.get('/',    taskController.getAllTasksByProject);

// ── Standalone task operations by task ID ─────────────────────────────────────
// GET    /api/projects/:projectId/tasks/:id     → get single task
// PUT    /api/projects/:projectId/tasks/:id     → update task
// DELETE /api/projects/:projectId/tasks/:id     → delete task

router.get('/:id',    taskController.getTaskById);
router.put('/:id',    taskController.updateTask);
router.delete('/:id', taskController.deleteTask);

module.exports = router;