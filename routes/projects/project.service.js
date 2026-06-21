import { Project } from '../../models/project.model.js';

export const createProjectService = async (data) => {
    const payload = { ...data };
    if (!payload.teamId) payload.teamId = null; // avoid casting "" to ObjectId
    const project = await Project.create(payload);
    return project;
};

export const getAllProjectsByCompanyService = async (companyId) => {
    return await Project.find({ companyId }).populate('companyId', 'name industry');
};

// ✅ NEW
export const getProjectsByTeamService = async (teamId) => {
    return await Project.find({ teamId }).populate('teamId', 'name');
};

export const getProjectByIdService = async (id) => {
    return await Project.findById(id).populate('companyId', 'name industry').populate('teamId', 'name');
};

export const updateProjectService = async (id, data) => {
    const payload = { ...data };
    if ('teamId' in payload && !payload.teamId) payload.teamId = null;
    return await Project.findByIdAndUpdate(id, payload, { new: true, runValidators: true });
};

export const deleteProjectService = async (id) => {
    return await Project.findByIdAndDelete(id);
};

export default {
    createProjectService,
    getAllProjectsByCompanyService,
    getProjectsByTeamService,
    getProjectByIdService,
    updateProjectService,
    deleteProjectService
};