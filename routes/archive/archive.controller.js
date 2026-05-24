const archiveService = require('./archive.service');
const { Project }   = require('../../models/project.model');
const { Task }      = require('../../models/task.model');

const isValidObjectId = (id) => /^[0-9a-fA-F]{24}$/.test(id);

// ── POST /api/archive/project/:id ─────────────────────────────────────────────

const archiveProject = async (req, res) => {
    const { id } = req.params;
    if (!isValidObjectId(id)) {
        return res.status(400).json({ success: false, message: 'Invalid project id.' });
    }

    try {
        const project = await Project.findById(id);
        if (!project) {
            return res.status(404).json({ success: false, message: 'Project not found.' });
        }
        if (project.isArchived) {
            return res.status(400).json({ success: false, message: 'Project is already archived.' });
        }

        const archived = await archiveService.archiveProjectService(id);
        return res.status(200).json({
            success: true,
            message: 'Project archived successfully.',
            data: archived
        });
    } catch (err) {
        console.error('[archiveProject]', err);
        return res.status(500).json({ success: false, message: err.message });
    }
};

// ── POST /api/archive/task/:id ────────────────────────────────────────────────

const archiveTask = async (req, res) => {
    const { id } = req.params;
    if (!isValidObjectId(id)) {
        return res.status(400).json({ success: false, message: 'Invalid task id.' });
    }

    try {
        const task = await Task.findById(id);
        if (!task) {
            return res.status(404).json({ success: false, message: 'Task not found.' });
        }
        if (task.isArchived) {
            return res.status(400).json({ success: false, message: 'Task is already archived.' });
        }

        const archived = await archiveService.archiveTaskService(id);
        return res.status(200).json({
            success: true,
            message: 'Task archived successfully.',
            data: archived
        });
    } catch (err) {
        console.error('[archiveTask]', err);
        return res.status(500).json({ success: false, message: err.message });
    }
};

// ── GET /api/archive/company/:id ──────────────────────────────────────────────

const getArchivedByCompany = async (req, res) => {
    const { id } = req.params;
    if (!isValidObjectId(id)) {
        return res.status(400).json({ success: false, message: 'Invalid company id.' });
    }

    try {
        const data = await archiveService.getArchivedByCompanyService(id);
        return res.status(200).json({ success: true, data });
    } catch (err) {
        console.error('[getArchivedByCompany]', err);
        return res.status(500).json({ success: false, message: err.message });
    }
};

// ── DELETE /api/archive/:id ───────────────────────────────────────────────────
// Restore — tries Project first, then Task

const restoreItem = async (req, res) => {
    const { id } = req.params;
    if (!isValidObjectId(id)) {
        return res.status(400).json({ success: false, message: 'Invalid id.' });
    }

    try {
        // Try restoring as a project first
        const project = await archiveService.restoreProjectService(id);
        if (project) {
            return res.status(200).json({
                success: true,
                message: 'Project restored successfully.',
                data: project
            });
        }

        // If not a project, try as a task
        const task = await archiveService.restoreTaskService(id);
        if (task) {
            return res.status(200).json({
                success: true,
                message: 'Task restored successfully.',
                data: task
            });
        }

        return res.status(404).json({ success: false, message: 'Item not found.' });
    } catch (err) {
        console.error('[restoreItem]', err);
        return res.status(500).json({ success: false, message: err.message });
    }
};

module.exports = {
    archiveProject,
    archiveTask,
    getArchivedByCompany,
    restoreItem
};