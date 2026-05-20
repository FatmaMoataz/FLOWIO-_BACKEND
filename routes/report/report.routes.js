const express = require('express');
const auth = require('../../middleware/auth');
const reportController = require('./report.controller');

const router = express.Router();
router.use(auth);

router.post('/', reportController.createReport);
router.get('/', reportController.getAllReports);
router.get('/:id', reportController.getReportById);
router.put('/:id', reportController.updateReport);
router.delete('/:id', reportController.deleteReport);

module.exports = router;
