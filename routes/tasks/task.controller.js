const Joi = require('joi');
const taskService = require('./task.service');
const { validateTask, validateTaskUpdate } = require('../../models/task.model');

// ── Helper ─────────────────────────────────────────────────────────────────────
const isValidObjectId = (id) => /^[0-9a-fA-F]{24}$/.test(id);

// ── Create Task ────────────────────────────────────────────────────────────────

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
        const task = await taskService.createTaskService({ ...req.body, projectId });
        return res.status(201).json({ success: true, data: task });
    } catch (err) {
        console.error('[createTask]', err);
        return res.status(500).json({ success: false, message: err.message });
    }
};

// ── Get All Tasks for a Project (with optional filters) ────────────────────────

const getAllTasksByProject = async (req, res) => {
    const { projectId } = req.params;
    if (!isValidObjectId(projectId)) {
        return res.status(400).json({ success: false, message: 'Invalid projectId in URL.' });
    }
    const filters = {};
    const { status, assignedTo, priority } = req.query;
    if (status)   filters.status   = status;
    if (priority) filters.priority = priority;
    if (assignedTo) {
        if (!isValidObjectId(assignedTo)) {
            return res.status(400).json({ success: false, message: 'Invalid assignedTo userId in query.' });
        }
        filters.assignedTo = assignedTo;
    }
    try {
        const tasks = await taskService.getAllTasksByProjectService(projectId, filters);
        return res.status(200).json({ success: true, count: tasks.length, data: tasks });
    } catch (err) {
        console.error('[getAllTasksByProject]', err);
        return res.status(500).json({ success: false, message: err.message });
    }
};

// ── Get My Tasks ───────────────────────────────────────────────────────────────

const getMyTasks = async (req, res) => {
    const filters = { assignedTo: req.user._id };
    if (req.query.status)   filters.status   = req.query.status;
    if (req.query.priority) filters.priority = req.query.priority;
    try {
        const tasks = await taskService.getTasksByFilterService(filters);
        return res.status(200).json({ success: true, count: tasks.length, data: tasks });
    } catch (err) {
        console.error('[getMyTasks]', err);
        return res.status(500).json({ success: false, message: err.message });
    }
};

// ── Get Task by ID ─────────────────────────────────────────────────────────────

const getTaskById = async (req, res) => {
    try {
        const task = await taskService.getTaskByIdService(req.params.id);
        if (!task) return res.status(404).json({ success: false, message: 'Task not found.' });
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
        if (!task) return res.status(404).json({ success: false, message: 'Task not found.' });
        return res.status(200).json({ success: true, data: task });
    } catch (err) {
        console.error('[updateTask]', err);
        return res.status(400).json({ success: false, message: err.message });
    }
};

// ── Assign Task ────────────────────────────────────────────────────────────────

const assignTask = async (req, res) => {
    const { assignedTo } = req.body;
    if (assignedTo !== null && assignedTo !== undefined) {
        if (!isValidObjectId(String(assignedTo))) {
            return res.status(400).json({ success: false, message: 'Invalid assignedTo userId.' });
        }
    }
    try {
        const task = await taskService.updateTaskService(
            req.params.id,
            { assignedTo: assignedTo || null }
        );
        if (!task) return res.status(404).json({ success: false, message: 'Task not found.' });
        const message = assignedTo ? 'Task assigned successfully.' : 'Task unassigned successfully.';
        return res.status(200).json({ success: true, message, data: task });
    } catch (err) {
        console.error('[assignTask]', err);
        return res.status(500).json({ success: false, message: err.message });
    }
};

// ── Link Task to Epic ──────────────────────────────────────────────────────────
// PUT /api/tasks/:id/epic
// Body: { "epicId": "<epicId>" }  → link to epic
// Body: { "epicId": null }        → remove from epic

const linkTaskToEpic = async (req, res) => {
    const { epicId } = req.body;

    if (epicId !== null && epicId !== undefined) {
        if (!isValidObjectId(String(epicId))) {
            return res.status(400).json({ success: false, message: 'Invalid epicId.' });
        }
    }

    try {
        const task = await taskService.updateTaskService(
            req.params.id,
            { epicId: epicId || null }
        );
        if (!task) return res.status(404).json({ success: false, message: 'Task not found.' });

        const message = epicId ? 'Task linked to epic.' : 'Task removed from epic.';
        return res.status(200).json({ success: true, message, data: task });
    } catch (err) {
        console.error('[linkTaskToEpic]', err);
        return res.status(500).json({ success: false, message: err.message });
    }
};

// ── Delete Task ────────────────────────────────────────────────────────────────

const deleteTask = async (req, res) => {
    try {
        const task = await taskService.deleteTaskService(req.params.id);
        if (!task) return res.status(404).json({ success: false, message: 'Task not found.' });
        return res.status(200).json({ success: true, message: 'Task deleted successfully.' });
    } catch (err) {
        console.error('[deleteTask]', err);
        return res.status(500).json({ success: false, message: err.message });
    }
};

module.exports = {
    createTask,
    getAllTasksByProject,
    getMyTasks,
    getTaskById,
    updateTask,
    assignTask,
    linkTaskToEpic,  // ← new
    deleteTask
};