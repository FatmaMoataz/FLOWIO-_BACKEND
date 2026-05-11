const projectService = require('./project.service');
const { validateProject, validateProjectUpdate } = require('../../models/project.model');

// ── Create Project ─────────────────────────────────────────────────────────────
// companyId comes from req.body — validated by Joi as a 24-char hex string.
// No injection from req.user here because a user may manage multiple companies.

const createProject = async (req, res) => {
    const { error } = validateProject(req.body);
    if (error) {
        const messages = error.details.map(d => d.message);
        return res.status(400).json({ success: false, errors: messages });
    }

    try {
        const project = await projectService.createProjectService(req.body);
        return res.status(201).json({ success: true, data: project });
    } catch (err) {
        console.error('[createProject]', err);
        return res.status(500).json({ success: false, message: err.message });
    }
};

// ── Get All Projects by Company ────────────────────────────────────────────────

const getAllProjectsByCompany = async (req, res) => {
    const { companyId } = req.params;

    if (!companyId || !/^[0-9a-fA-F]{24}$/.test(companyId)) {
        return res.status(400).json({ success: false, message: 'Invalid companyId format.' });
    }

    try {
        const projects = await projectService.getAllProjectsByCompanyService(companyId);
        return res.status(200).json({ success: true, data: projects });
    } catch (err) {
        console.error('[getAllProjectsByCompany]', err);
        return res.status(500).json({ success: false, message: err.message });
    }
};

// ── Get Project by ID ──────────────────────────────────────────────────────────

const getProjectById = async (req, res) => {
    try {
        const project = await projectService.getProjectByIdService(req.params.id);
        if (!project) {
            return res.status(404).json({ success: false, message: 'Project not found.' });
        }
        return res.status(200).json({ success: true, data: project });
    } catch (err) {
        console.error('[getProjectById]', err);
        return res.status(500).json({ success: false, message: err.message });
    }
};

// ── Update Project ─────────────────────────────────────────────────────────────

const updateProject = async (req, res) => {
    if (!req.body || Object.keys(req.body).length === 0) {
        return res.status(400).json({ success: false, message: 'No data provided for update.' });
    }

    const { error } = validateProjectUpdate(req.body);
    if (error) {
        const messages = error.details.map(d => d.message);
        return res.status(400).json({ success: false, errors: messages });
    }

    try {
        const project = await projectService.updateProjectService(req.params.id, req.body);
        if (!project) {
            return res.status(404).json({ success: false, message: 'Project not found.' });
        }
        return res.status(200).json({ success: true, data: project });
    } catch (err) {
        console.error('[updateProject]', err);
        return res.status(400).json({ success: false, message: err.message });
    }
};

// ── Delete Project ─────────────────────────────────────────────────────────────

const deleteProject = async (req, res) => {
    try {
        const project = await projectService.deleteProjectService(req.params.id);
        if (!project) {
            return res.status(404).json({ success: false, message: 'Project not found.' });
        }
        return res.status(200).json({ success: true, message: 'Project deleted successfully.' });
    } catch (err) {
        console.error('[deleteProject]', err);
        return res.status(500).json({ success: false, message: err.message });
    }
};

module.exports = {
    createProject,
    getAllProjectsByCompany,
    getProjectById,
    updateProject,
    deleteProject
};