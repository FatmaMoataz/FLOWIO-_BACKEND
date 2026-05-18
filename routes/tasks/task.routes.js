import express from 'express';
import auth from '../../middleware/auth.js';
import * as taskController from './task.controller.js';

const router = express.Router({ mergeParams: true });

router.use(auth);

// ── Standalone routes — /api/tasks ────────────────────────────────────────────
router.post('/',           taskController.createTask);        // ← personal task (no projectId)
router.get('/my-tasks',    taskController.getMyTasks);        // ← personal tasks for logged-in user
router.put('/:id/assign',  taskController.assignTask);
router.put('/:id/epic',    taskController.linkTaskToEpic);
router.get('/:id',         taskController.getTaskById);
router.put('/:id',         taskController.updateTask);
router.delete('/:id',      taskController.deleteTask);

// ── Nested routes — /api/projects/:projectId/tasks ────────────────────────────
router.post('/',      taskController.createTask);             // projectId injected via mergeParams
router.get('/',       taskController.getAllTasksByProject);
router.get('/:id',    taskController.getTaskById);
router.put('/:id',    taskController.updateTask);
router.delete('/:id', taskController.deleteTask);

export default router;