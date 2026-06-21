import companyService from './company.service.js';
import { validateCompany, validateCompanyUpdate } from '../../models/company.js';
import { getCompanyByIdService, updateCompanyService } from './company.service.js';


export const createCompany = async (req, res) => {
    const { error } = validateCompany(req.body);
    if (error) return res.status(400).json({ success: false, message: error.details[0].message });

    try {
        const company = await companyService.createCompanyService(req.body);
        res.status(201).json({ success: true, data: company });
    } catch (err) {
        console.error('[createCompany] Error:', err);
        res.status(400).json({ success: false, message: err.message });
    }
};

export const getAllCompanies = async (req, res) => {
    try {
        const companies = await companyService.getAllCompaniesService();
        res.status(200).json({ success: true, data: companies });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const getCompanyById = async (req, res) => {
    try {
        const company = await companyService.getCompanyByIdService(req.params.id);
        res.status(200).json({ success: true, data: company });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const updateCompany = async (req, res) => {
    if (!req.body || Object.keys(req.body).length === 0) {
        return res.status(400).json({ success: false, message: 'No data provided for update' });
    }

    const { error } = validateCompanyUpdate(req.body);
    if (error) return res.status(400).json({ success: false, message: error.details[0].message });

    try {
        const company = await companyService.updateCompanyService(req.params.id, req.body);
        if (!company) {
            return res.status(404).json({ success: false, message: 'Company not found' });
        }
        res.status(200).json({ success: true, data: company });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};

export const deleteCompany = async (req, res) => {
    try {
        const company = await companyService.deleteCompanyService(req.params.id);
        if (!company) {
            return res.status(404).json({ success: false, message: 'Company not found' });
        }
        res.status(200).json({ success: true, message: 'Company deleted successfully' });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

export const getMyCompany = async (req, res) => {
  try {
    const company = await getCompanyByIdService(req.user.companyId);
    if (!company) {
      return res.status(404).json({ success: false, message: 'Company not found.' });
    }
    return res.status(200).json({ success: true, data: company });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const updateMyCompany = async (req, res) => {
  try {
    const { error } = validateCompanyUpdate(req.body);
    if (error) {
      return res.status(400).json({ success: false, message: error.details[0].message });
    }
 
    const updated = await updateCompanyService(req.user.companyId, req.body);
    return res.status(200).json({ success: true, data: updated });
  } catch (error) {
    return res.status(400).json({ success: false, message: error.message });
  }
};