import express from 'express';
import auth from '../middleware/auth.js';
import * as companyController from './companies/company.controller.js';

const router = express.Router();

// Apply auth middleware to all routes
//router.use(auth);

// Define routes
router.post('/', companyController.createCompany);
router.get('/', companyController.getAllCompanies);
router.get('/:id', companyController.getCompanyById);
router.put('/:id', companyController.updateCompany);
router.delete('/:id', companyController.deleteCompany);

export default router;