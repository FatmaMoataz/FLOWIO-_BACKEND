import express from 'express';
import auth from '../../middleware/auth.js';
import * as reportController from './report.controller.js';

const router = express.Router();
router.use(auth);

router.post('/', reportController.createReport);
router.get('/', reportController.getAllReports);
router.get('/:id', reportController.getReportById);
router.put('/:id', reportController.updateReport);
router.delete('/:id', reportController.deleteReport);

export default router;
