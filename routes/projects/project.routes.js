import express from 'express';
import auth from '../../middleware/auth.js';
import * as projectController from './project.controller.js';

const router = express.Router();

router.use(auth);

router.post('/',                              projectController.createProject);
router.get('/company/:companyId',             projectController.getAllProjectsByCompany);
router.get('/team/:teamId',                   projectController.getProjectsByTeam); // ✅ NEW
router.put('/:projectId/update-status',       projectController.updateProjectStatus);
router.get('/:id',                            projectController.getProjectById);
router.put('/:id',                            projectController.updateProject);
router.delete('/:id',                         projectController.deleteProject);

export default router;