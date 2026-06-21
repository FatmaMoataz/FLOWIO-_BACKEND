import express from 'express';
import auth from '../middleware/auth.js';
import * as companyController from './companies/company.controller.js';

const router = express.Router();

// IMPORTANT: literal paths must come before parameterized ones.
// If '/:id' is registered first, Express matches "me" as an :id and
// Mongoose throws the ObjectId cast error you just saw.
router.get('/me', auth, companyController.getMyCompany);
router.put('/me', auth, companyController.updateMyCompany);

router.post('/', auth, companyController.createCompany);
router.get('/', auth, companyController.getAllCompanies);
router.get('/:id', auth, companyController.getCompanyById);
router.put('/:id', auth, companyController.updateCompany);
router.delete('/:id', auth, companyController.deleteCompany);

export default router;