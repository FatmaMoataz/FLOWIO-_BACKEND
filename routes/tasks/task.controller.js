import taskService from './task.service.js';
import Notification from '../../models/notification.js';
import {User} from '../../models/user.js';
import { validateTask, validateTaskUpdate } from '../../models/task.model.js';

const isValidObjectId = (id) => /^[0-9a-fA-F]{24}$/.test(id);

export const createTask = async (req, res) => {
    const projectId = req.params.projectId ?? null;

    if (projectId && !isValidObjectId(projectId)) {
        return res.status(400).json({ success: false, message: 'Invalid projectId in URL.' });
    }

    const { error } = validateTask(req.body);
    if (error) {
        return res.status(400).json({ success: false, errors: error.details.map(d => d.message) });
    }

    try {
        const task = await taskService.createTaskService({
            ...req.body,
            projectId,
            assignedTo: req.user._id
        });

        if (req.body.assignedTo && String(req.body.assignedTo) !== String(req.user._id)) {
            const fromUser = await User.findById(req.user._id).select('name'); // ← fetch name

            await Notification.create({
                title: "Task Assigned",
                message: `${fromUser.name} assigned you a task: "${task.title}"`,
                type: "TASK_ASSIGNED",
                userId: req.body.assignedTo,
                fromUserId: req.user._id,
                referenceId: task._id,
                referenceModel: "Task",
            });
        }

        return res.status(201).json({ success: true, data: task });
    } catch (err) {
        return res.status(500).json({ success: false, message: err.message });
    }
};

export const assignTask = async (req, res) => {
    const { assignedTo } = req.body;
    if (assignedTo !== null && assignedTo !== undefined) {
        if (!isValidObjectId(String(assignedTo))) {
            return res.status(400).json({ success: false, message: 'Invalid assignedTo userId.' });
        }
    }
    try {
        const task = await taskService.updateTaskService(req.params.id, { assignedTo: assignedTo || null });
        if (!task) return res.status(404).json({ success: false, message: 'Task not found.' });

        if (assignedTo && String(assignedTo) !== String(req.user._id)) {
            const fromUser = await User.findById(req.user._id).select('name'); // ← fetch name

            await Notification.create({
                title: "Task Assigned",
                message: `${fromUser.name} assigned you a task: "${task.title}"`,
                type: "TASK_ASSIGNED",
                userId: assignedTo,
                fromUserId: req.user._id,
                referenceId: task._id,
                referenceModel: "Task",
            });
        }

        const message = assignedTo ? 'Task assigned successfully.' : 'Task unassigned successfully.';
        return res.status(200).json({ success: true, message, data: task });
    } catch (err) {
        return res.status(500).json({ success: false, message: err.message });
    }
};

export const updateTask = async (req, res) => {
    if (!req.body || Object.keys(req.body).length === 0) {
        return res.status(400).json({ success: false, message: 'No data provided for update.' });
    }
    const { error } = validateTaskUpdate(req.body);
    if (error) {
        return res.status(400).json({ success: false, errors: error.details.map(d => d.message) });
    }
    try {
        const task = await taskService.updateTaskService(req.params.id, req.body);
        if (!task) return res.status(404).json({ success: false, message: 'Task not found.' });

        if (task.assignedTo && String(task.assignedTo) !== String(req.user._id)) {
            const fromUser = await User.findById(req.user._id).select('name'); // ← fetch name

            await Notification.create({
                title: "Task Updated",
                message: `${fromUser.name} updated the task: "${task.title}"`,
                type: "TASK_UPDATED",
                userId: task.assignedTo,
                fromUserId: req.user._id,
                referenceId: task._id,
                referenceModel: "Task",
            });
        }

        return res.status(200).json({ success: true, data: task });
    } catch (err) {
        return res.status(400).json({ success: false, message: err.message });
    }
};

// ── Get All Tasks for a Project ────────────────────────────────────────────────
export const getAllTasksByProject = async (req, res) => {
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

// ── Get My Tasks (personal — projectId is null) ────────────────────────────────
export const getMyTasks = async (req, res) => {
    const filters = {
        assignedTo: req.user._id,
        projectId: null             // ← only personal tasks
    };
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
export const getTaskById = async (req, res) => {
    try {
        const task = await taskService.getTaskByIdService(req.params.id);
        if (!task) return res.status(404).json({ success: false, message: 'Task not found.' });
        return res.status(200).json({ success: true, data: task });
    } catch (err) {
        console.error('[getTaskById]', err);
        return res.status(500).json({ success: false, message: err.message });
    }
};

// ── Link Task to Epic ──────────────────────────────────────────────────────────
export const linkTaskToEpic = async (req, res) => {
    const { epicId } = req.body;
    if (epicId !== null && epicId !== undefined) {
        if (!isValidObjectId(String(epicId))) {
            return res.status(400).json({ success: false, message: 'Invalid epicId.' });
        }
    }
    try {
        const task = await taskService.updateTaskService(req.params.id, { epicId: epicId || null });
        if (!task) return res.status(404).json({ success: false, message: 'Task not found.' });
        const message = epicId ? 'Task linked to epic.' : 'Task removed from epic.';
        return res.status(200).json({ success: true, message, data: task });
    } catch (err) {
        console.error('[linkTaskToEpic]', err);
        return res.status(500).json({ success: false, message: err.message });
    }
};

// ── Delete Task ────────────────────────────────────────────────────────────────
export const deleteTask = async (req, res) => {
    try {
        const task = await taskService.deleteTaskService(req.params.id);
        if (!task) return res.status(404).json({ success: false, message: 'Task not found.' });
        return res.status(200).json({ success: true, message: 'Task deleted successfully.' });
    } catch (err) {
        console.error('[deleteTask]', err);
        return res.status(500).json({ success: false, message: err.message });
    }
};