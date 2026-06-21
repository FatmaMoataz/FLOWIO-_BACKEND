import express from 'express';
import auth from '../../middleware/auth.js';
import * as subtaskController from './subtask.controller.js';

const router = express.Router();

// All subtask routes are protected
router.use(auth);

// POST   /api/subtasks                → create a new subtask
router.post('/', subtaskController.createSubtask);

// ⚠️ IMPORTANT: /story/:storyId MUST be before /:id
// GET    /api/subtasks/story/:storyId  → get all subtasks for a story
router.get('/story/:storyId', subtaskController.getAllSubtasksByStory);

// GET    /api/subtasks/task/:taskId    → get all subtasks for a task
router.get('/task/:taskId', subtaskController.getAllSubtasksByTask);

// GET    /api/subtasks/:id             → get a single subtask
router.get('/:id', subtaskController.getSubtaskById);

// PUT    /api/subtasks/:id             → update a subtask
router.put('/:id', subtaskController.updateSubtask);

// DELETE /api/subtasks/:id             → delete a subtask
router.delete('/:id', subtaskController.deleteSubtask);

export default router;