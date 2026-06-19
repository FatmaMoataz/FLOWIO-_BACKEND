import express from 'express';
import auth from '../../middleware/auth.js';
import * as storyController from './story.controller.js';

const router = express.Router();

router.use(auth);

router.post('/', storyController.createStory);
router.get('/project/:projectId', storyController.getStoriesByProject);
router.get('/epic/:epicId', storyController.getStoriesByEpic);
router.get('/:id', storyController.getStoryById);
router.put('/:id', storyController.updateStory);
router.delete('/:id', storyController.deleteStory);

export default router;