import express from 'express';
import auth from '../../middleware/auth.js';
import * as subtaskController from './subtask.controller.js';

const router = express.Router();

router.use(auth);

router.post('/', subtaskController.createSubtask);
router.get('/story/:storyId', subtaskController.getAllSubtasksByStory); // NEW
router.get('/task/:taskId', subtaskController.getAllSubtasksByTask);
router.get('/:id', subtaskController.getSubtaskById);
router.put('/:id', subtaskController.updateSubtask);
router.delete('/:id', subtaskController.deleteSubtask);

export default router;