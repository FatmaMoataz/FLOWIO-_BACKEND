import { Company } from '../../models/company.js';

export const createCompanyService = async (data) => {
    const company = await Company.create(data);
    return company;
};

export const getAllCompaniesService = async () => {
    const companies = await Company.find().populate('userId teamId projectId');
    return companies;
};

export const getCompanyByIdService = async (id) => {
    return await Company.findById(id).populate('userId teamId projectId');
};

// export const updateCompanyService = async (id, data) => {
//     return await Company.findByIdAndUpdate(id, data, { new: true });
// };

export const deleteCompanyService = async (id) => {
    return await Company.findByIdAndDelete(id);
};

// export const getCompanyByIdService = async (id) => {
//   return await Company.findById(id);
// };
 
export const updateCompanyService = async (id, data) => {
  return await Company.findByIdAndUpdate(id, data, { new: true, runValidators: true });
};

// عمل export default للكائن لتسهيل استدعائه في الـ Controller كـ كائن موحد
export default {
    createCompanyService,
    getAllCompaniesService,
    getCompanyByIdService,
    updateCompanyService,
    deleteCompanyService
};