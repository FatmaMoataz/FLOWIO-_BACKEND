import companyService from './company.service.js';
import { validateCompanyUpdate } from '../../models/company.js';
import { User } from '../../models/user.js';

export const createCompany = async (req, res) => {
  try {
    const company = await companyService.createCompanyService(req.body);
    return res.status(201).json({ success: true, data: company });
  } catch (error) {
    return res.status(400).json({ success: false, message: error.message });
  }
};

export const getAllCompanies = async (req, res) => {
  try {
    const companies = await companyService.getAllCompaniesService();
    return res.status(200).json({ success: true, data: companies });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const getCompanyById = async (req, res) => {
  try {
    const company = await companyService.getCompanyByIdService(req.params.id);
    if (!company) {
      return res.status(404).json({ success: false, message: 'Company not found.' });
    }
    return res.status(200).json({ success: true, data: company });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const updateCompany = async (req, res) => {
  try {
    const updated = await companyService.updateCompanyService(req.params.id, req.body);
    if (!updated) {
      return res.status(404).json({ success: false, message: 'Company not found.' });
    }
    return res.status(200).json({ success: true, data: updated });
  } catch (error) {
    return res.status(400).json({ success: false, message: error.message });
  }
};

export const deleteCompany = async (req, res) => {
  try {
    const deleted = await companyService.deleteCompanyService(req.params.id);
    if (!deleted) {
      return res.status(404).json({ success: false, message: 'Company not found.' });
    }
    return res.status(200).json({ success: true, message: 'Company deleted successfully.' });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ---- NEW: these two are what the onboarding page actually calls ----

// GET /api/companies/me
export const getMyCompany = async (req, res) => {
  try {
    // req.user (from the JWT payload) may only carry _id/role — companyId
    // lives on the User document, not necessarily on the token itself.
    const currentUser = await User.findById(req.user._id).select('companyId');
    if (!currentUser?.companyId) {
      return res.status(404).json({ success: false, message: 'No company linked to this account.' });
    }

    const company = await companyService.getCompanyByIdService(currentUser.companyId);
    if (!company) {
      return res.status(404).json({ success: false, message: 'Company not found.' });
    }
    return res.status(200).json({ success: true, data: company });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// PUT /api/companies/me
export const updateMyCompany = async (req, res) => {
  try {
    const { error } = validateCompanyUpdate(req.body);
    if (error) {
      return res.status(400).json({ success: false, message: error.details[0].message });
    }

    const currentUser = await User.findById(req.user._id).select('companyId');
    if (!currentUser?.companyId) {
      return res.status(404).json({ success: false, message: 'No company linked to this account.' });
    }

    const updated = await companyService.updateCompanyService(currentUser.companyId, req.body);
    return res.status(200).json({ success: true, data: updated });
  } catch (error) {
    return res.status(400).json({ success: false, message: error.message });
  }
};