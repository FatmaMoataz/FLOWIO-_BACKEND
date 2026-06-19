import express from 'express';
import auth from '../../middleware/auth.js';
import * as projectController from './project.controller.js';

const router = express.Router();

// All project routes are protected
router.use(auth);

// POST   /api/projects              → create a new project
// GET    /api/projects/company/:companyId → get all projects for a company
// GET    /api/projects/:id          → get a single project
// PUT    /api/projects/:id          → update a project
// DELETE /api/projects/:id          → delete a project

router.post('/',                              projectController.createProject);
router.get('/company/:companyId',             projectController.getAllProjectsByCompany);
router.put('/:projectId/update-status', projectController.updateProjectStatus);
router.get('/:id',                            projectController.getProjectById);
router.put('/:id',                            projectController.updateProject);
router.delete('/:id',                         projectController.deleteProject);

export default router;