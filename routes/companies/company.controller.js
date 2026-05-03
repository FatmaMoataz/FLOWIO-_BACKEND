const companyService = require('./company.service.js');
const { validateCompany, validateCompanyUpdate } = require('../../models/company');

const createCompany = async (req, res) => {
    const { error } = validateCompany(req.body);
    if (error) return res.status(400).json({ success: false, message: error.details[0].message });

    try {
        const company = await companyService.createCompanyService(req.body);
        res.status(201).json({ success: true, data: company });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};

const getAllCompanies = async (req, res) => {
    try {
        const companies = await companyService.getAllCompaniesService();
        res.status(200).json({ success: true, data: companies });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

const getCompanyById = async (req, res) => {
    try {
        const company = await companyService.getCompanyByIdService(req.params.id);
        res.status(200).json({ success: true, data: company });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

const updateCompany = async (req, res) => {
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

const deleteCompany = async (req, res) => {
    try {
        const company = await companyService.deleteCompanyService(req.params.id);
        if (!company) {
            return res.status(404).json({ success: false, message: 'Company not found' });
        }
        res.status(200).json({ success: true, message: 'Company deleted successfully' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

module.exports = {
    createCompany,
    getAllCompanies,
    getCompanyById,
    updateCompany,
    deleteCompany
};