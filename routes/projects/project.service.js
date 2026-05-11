const { Project } = require('../../models/project.model');

// ── Create ─────────────────────────────────────────────────────────────────────

const createProjectService = async (data) => {
    const project = await Project.create(data);
    return project;
};

// ── Read ───────────────────────────────────────────────────────────────────────

const getAllProjectsByCompanyService = async (companyId) => {
    return await Project.find({ companyId }).populate('companyId', 'name industry');
};

const getProjectByIdService = async (id) => {
    return await Project.findById(id).populate('companyId', 'name industry');
};

// ── Update ─────────────────────────────────────────────────────────────────────

const updateProjectService = async (id, data) => {
    return await Project.findByIdAndUpdate(id, data, { new: true, runValidators: true });
};

// ── Delete ─────────────────────────────────────────────────────────────────────

const deleteProjectService = async (id) => {
    return await Project.findByIdAndDelete(id);
};

module.exports = {
    createProjectService,
    getAllProjectsByCompanyService,
    getProjectByIdService,
    updateProjectService,
    deleteProjectService
};