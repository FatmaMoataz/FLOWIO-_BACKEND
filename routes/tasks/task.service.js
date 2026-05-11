const { Task } = require('../../models/task.model');

// ── Shared populate config ─────────────────────────────────────────────────────
const TASK_POPULATE = [
    { path: 'assignedTo', select: 'name email' },
    { path: 'projectId',  select: 'name status' }
];

// ── Create ─────────────────────────────────────────────────────────────────────

const createTaskService = async (data) => {
    const task = await Task.create(data);
    // Populate after creation so the response is immediately useful to the frontend
    return await task.populate(TASK_POPULATE);
};

// ── Read ───────────────────────────────────────────────────────────────────────

const getAllTasksByProjectService = async (projectId) => {
    return await Task.find({ projectId })
        .populate(TASK_POPULATE)
        .sort({ createdAt: -1 }); // newest first
};

const getTaskByIdService = async (id) => {
    return await Task.findById(id).populate(TASK_POPULATE);
};

// ── Update ─────────────────────────────────────────────────────────────────────

const updateTaskService = async (id, data) => {
    return await Task.findByIdAndUpdate(
        id,
        data,
        { new: true, runValidators: true }
    ).populate(TASK_POPULATE);
};

// ── Delete ─────────────────────────────────────────────────────────────────────

const deleteTaskService = async (id) => {
    return await Task.findByIdAndDelete(id);
};

module.exports = {
    createTaskService,
    getAllTasksByProjectService,
    getTaskByIdService,
    updateTaskService,
    deleteTaskService
};