// Remember: since our model exports an object { Company, subscriptionPlanEnum },
// we destructure Company here.
const { Company } = require('../../models/company');

const createCompanyService = async (data) => {
    const company = await Company.create(data);
    return company;
};

const getAllCompaniesService = async () => {
    const companies = await Company.find().populate('userId teamId projectId');
    return companies;
};

const getCompanyByIdService = async (id) => {
    return await Company.findById(id).populate('userId teamId projectId');
};

const updateCompanyService = async (id, data) => {
    return await Company.findByIdAndUpdate(id, data, { new: true });
};

const deleteCompanyService = async (id) => {
    return await Company.findByIdAndDelete(id);
};

module.exports = {
    createCompanyService,
    getAllCompaniesService,
    getCompanyByIdService,
    updateCompanyService,
    deleteCompanyService
};