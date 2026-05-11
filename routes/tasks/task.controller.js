const taskService = require('./task.service');
const { validateTask, validateTaskUpdate } = require('../../models/task.model');

// ── Helper — ObjectId format check ────────────────────────────────────────────
const isValidObjectId = (id) => /^[0-9a-fA-F]{24}$/.test(id);

// ── Create Task ────────────────────────────────────────────────────────────────
// projectId is taken from req.params (nested route: POST /projects/:projectId/tasks)
// and injected into the data — never trusted from req.body to prevent spoofing.

const createTask = async (req, res) => {
    const { projectId } = req.params;

    if (!isValidObjectId(projectId)) {
        return res.status(400).json({ success: false, message: 'Invalid projectId in URL.' });
    }

    const { error } = validateTask(req.body);
    if (error) {
        const messages = error.details.map(d => d.message);
        return res.status(400).json({ success: false, errors: messages });
    }

    try {
        // Merge validated body with projectId from URL — body cannot override this
        const task = await taskService.createTaskService({ ...req.body, projectId });
        return res.status(201).json({ success: true, data: task });
    } catch (err) {
        console.error('[createTask]', err);
        return res.status(500).json({ success: false, message: err.message });
    }
};

// ── Get All Tasks for a Project ────────────────────────────────────────────────

const getAllTasksByProject = async (req, res) => {
    const { projectId } = req.params;

    if (!isValidObjectId(projectId)) {
        return res.status(400).json({ success: false, message: 'Invalid projectId in URL.' });
    }

    try {
        const tasks = await taskService.getAllTasksByProjectService(projectId);
        return res.status(200).json({ success: true, data: tasks });
    } catch (err) {
        console.error('[getAllTasksByProject]', err);
        return res.status(500).json({ success: false, message: err.message });
    }
};

// ── Get Task by ID ─────────────────────────────────────────────────────────────

const getTaskById = async (req, res) => {
    try {
        const task = await taskService.getTaskByIdService(req.params.id);
        if (!task) {
            return res.status(404).json({ success: false, message: 'Task not found.' });
        }
        return res.status(200).json({ success: true, data: task });
    } catch (err) {
        console.error('[getTaskById]', err);
        return res.status(500).json({ success: false, message: err.message });
    }
};

// ── Update Task ────────────────────────────────────────────────────────────────

const updateTask = async (req, res) => {
    if (!req.body || Object.keys(req.body).length === 0) {
        return res.status(400).json({ success: false, message: 'No data provided for update.' });
    }

    const { error } = validateTaskUpdate(req.body);
    if (error) {
        const messages = error.details.map(d => d.message);
        return res.status(400).json({ success: false, errors: messages });
    }

    try {
        const task = await taskService.updateTaskService(req.params.id, req.body);
        if (!task) {
            return res.status(404).json({ success: false, message: 'Task not found.' });
        }
        return res.status(200).json({ success: true, data: task });
    } catch (err) {
        console.error('[updateTask]', err);
        return res.status(400).json({ success: false, message: err.message });
    }
};

// ── Delete Task ────────────────────────────────────────────────────────────────

const deleteTask = async (req, res) => {
    try {
        const task = await taskService.deleteTaskService(req.params.id);
        if (!task) {
            return res.status(404).json({ success: false, message: 'Task not found.' });
        }
        return res.status(200).json({ success: true, message: 'Task deleted successfully.' });
    } catch (err) {
        console.error('[deleteTask]', err);
        return res.status(500).json({ success: false, message: err.message });
    }
};

module.exports = {
    createTask,
    getAllTasksByProject,
    getTaskById,
    updateTask,
    deleteTask
};