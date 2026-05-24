// إضافة امتداد .js للموديل المحلي إجباري
import { Task } from '../../models/task.model.js';

// ── Shared populate config ─────────────────────────────────────────────────────
const TASK_POPULATE = [
    { path: 'assignedTo', select: 'name email specialization' },
    { path: 'projectId',  select: 'name status' }
];

// ── Create ─────────────────────────────────────────────────────────────────────
export const createTaskService = async (data) => {
    const task = await Task.create(data);
    return await task.populate(TASK_POPULATE);
};

// ── Get All Tasks for a Project (with optional filters) ────────────────────────
export const getAllTasksByProjectService = async (projectId, filters = {}) => {
    const query = { projectId, ...filters };
    return await Task.find(query)
        .populate(TASK_POPULATE)
        .sort({ createdAt: -1 });
};

// ── Get Tasks by any filter (used for my-tasks) ────────────────────────────────
export const getTasksByFilterService = async (filters = {}) => {
    return await Task.find(filters)
        .populate(TASK_POPULATE)
        .sort({ createdAt: -1 });
};

// ── Get Single Task ────────────────────────────────────────────────────────────
export const getTaskByIdService = async (id) => {
    return await Task.findById(id).populate(TASK_POPULATE);
};

// ── Update Task ────────────────────────────────────────────────────────────────
export const updateTaskService = async (id, data) => {
    return await Task.findByIdAndUpdate(
        id,
        data,
        { new: true, runValidators: true }
    ).populate(TASK_POPULATE);
};

// ── Delete Task ────────────────────────────────────────────────────────────────
export const deleteTaskService = async (id) => {
    return await Task.findByIdAndDelete(id);
};

// كائن الـ default لسهولة الاستدعاء بالتنقيط في الـ Controller
export default {
    createTaskService,
    getAllTasksByProjectService,
    getTasksByFilterService,
    getTaskByIdService,
    updateTaskService,
    deleteTaskService
};