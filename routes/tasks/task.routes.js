import express from 'express';
import auth from '../../middleware/auth.js';
import taskController from './task.controller.js';

const router = express.Router({ mergeParams: true });

router.use(auth);

// ── Standalone routes — registered as /api/tasks in index.js ──────────────────
// GET /api/tasks/my-tasks          → tasks assigned to me
// PUT /api/tasks/:id/assign        → assign/unassign a task
// PUT /api/tasks/:id/epic          → link/unlink a task to an epic ← NEW

router.get('/my-tasks',    taskController.getMyTasks);
router.put('/:id/assign',  taskController.assignTask);
router.put('/:id/epic',    taskController.linkTaskToEpic);  // ← new

// ── Nested under /api/projects/:projectId/tasks ────────────────────────────────

router.post('/',      taskController.createTask);
router.get('/',       taskController.getAllTasksByProject);
router.get('/:id',    taskController.getTaskById);
router.put('/:id',    taskController.updateTask);
router.delete('/:id', taskController.deleteTask);

export default router;