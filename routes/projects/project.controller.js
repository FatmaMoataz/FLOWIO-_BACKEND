import projectService from './project.service.js';
import { validateProject, validateProjectUpdate } from '../../models/project.model.js';
import { Story } from '../../models/story.model.js';

// ── Create Project ─────────────────────────────────────────────────────────────
export const createProject = async (req, res) => {
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
export const getAllProjectsByCompany = async (req, res) => {
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
export const getProjectById = async (req, res) => {
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
export const updateProject = async (req, res) => {
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
export const deleteProject = async (req, res) => {
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

export const updateProjectStatus = async (req, res) => {
    const { projectId } = req.params;

    if (!/^[0-9a-fA-F]{24}$/.test(projectId)) {
        return res.status(400).json({ success: false, message: 'Invalid projectId.' });
    }

    try {
        // Count all stories and done stories
        const totalStories = await Story.countDocuments({ projectId });
        const doneStories = await Story.countDocuments({ 
            projectId, 
            status: { $in: ['Done', 'done'] } 
        });

        let newStatus = 'active';
        if (totalStories > 0 && totalStories === doneStories) {
            newStatus = 'completed';
        }

        const project = await projectService.updateProjectService(projectId, { 
            status: newStatus 
        });

        return res.status(200).json({ 
            success: true, 
            data: project,
            message: `Project status updated to: ${newStatus}` 
        });
    } catch (err) {
        console.error('[updateProjectStatus]', err);
        return res.status(500).json({ success: false, message: err.message });
    }
};