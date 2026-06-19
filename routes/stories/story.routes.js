import express from 'express';
import auth from '../../middleware/auth.js';
import * as storyController from './story.controller.js';

const router = express.Router();

router.use(auth);

// POST   /api/stories                    → Create a new story
// GET    /api/stories/project/:projectId → Get all stories for a project
// GET    /api/stories/epic/:epicId       → Get all stories for an epic
// GET    /api/stories/:id                → Get a single story with subtasks
// PUT    /api/stories/:id                → Update a story
// DELETE /api/stories/:id                → Delete a story (and its subtasks)

router.post('/', storyController.createStory);
router.get('/project/:projectId', storyController.getStoriesByProject);
router.get('/epic/:epicId', storyController.getStoriesByEpic);
router.get('/:id', storyController.getStoryById);
router.put('/:id', storyController.updateStory);
router.delete('/:id', storyController.deleteStory);

export default router;