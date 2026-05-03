const express = require('express');
const auth = require('../middleware/auth');
const companyController = require('./company.controller.js');

const router = express.Router();

router.use(auth);

router.post('/', companyController.createCompany);
router.get('/', companyController.getAllCompanies);
router.get('/:id', companyController.getCompanyById);
router.put('/:id', companyController.updateCompany);
router.delete('/:id', companyController.deleteCompany);

module.exports = router;