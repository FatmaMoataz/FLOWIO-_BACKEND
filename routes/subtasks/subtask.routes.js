import express from 'express';
import auth from '../../middleware/auth.js';
import * as subtaskController from './subtask.controller.js';

const router = express.Router();

// All subtask routes are protected
router.use(auth);

// POST   /api/subtasks                → create a new subtask
// GET    /api/subtasks/task/:taskId   → get all subtasks for a given task
// GET    /api/subtasks/:id            → get a single subtask
// PUT    /api/subtasks/:id            → update a subtask
// DELETE /api/subtasks/:id            → delete a subtask

router.post('/',                              subtaskController.createSubtask);
router.get('/task/:taskId',                   subtaskController.getAllSubtasksByTask);
router.get('/:id',                            subtaskController.getSubtaskById);
router.put('/:id',                            subtaskController.updateSubtask);
router.delete('/:id',                         subtaskController.deleteSubtask);

export default router;