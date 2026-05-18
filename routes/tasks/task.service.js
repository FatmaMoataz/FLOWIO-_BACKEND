const { Task } = require('../../models/task.model');

// ── Shared populate config ─────────────────────────────────────────────────────
const TASK_POPULATE = [
    { path: 'assignedTo', select: 'name email specialization' },
    { path: 'projectId',  select: 'name status' }
];

// ── Create ─────────────────────────────────────────────────────────────────────

const createTaskService = async (data) => {
    const task = await Task.create(data);
    return await task.populate(TASK_POPULATE);
};

// ── Get All Tasks for a Project (with optional filters) ────────────────────────

const getAllTasksByProjectService = async (projectId, filters = {}) => {
    const query = { projectId, ...filters };
    return await Task.find(query)
        .populate(TASK_POPULATE)
        .sort({ createdAt: -1 });
};

// ── Get Tasks by any filter (used for my-tasks) ────────────────────────────────

const getTasksByFilterService = async (filters = {}) => {
    return await Task.find(filters)
        .populate(TASK_POPULATE)
        .sort({ createdAt: -1 });
};

// ── Get Single Task ────────────────────────────────────────────────────────────

const getTaskByIdService = async (id) => {
    return await Task.findById(id).populate(TASK_POPULATE);
};

// ── Update Task ────────────────────────────────────────────────────────────────

const updateTaskService = async (id, data) => {
    return await Task.findByIdAndUpdate(
        id,
        data,
        { new: true, runValidators: true }
    ).populate(TASK_POPULATE);
};

// ── Delete Task ────────────────────────────────────────────────────────────────

const deleteTaskService = async (id) => {
    return await Task.findByIdAndDelete(id);
};

module.exports = {
    createTaskService,
    getAllTasksByProjectService,
    getTasksByFilterService,
    getTaskByIdService,
    updateTaskService,
    deleteTaskService
};