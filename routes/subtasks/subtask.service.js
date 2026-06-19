// إضافة امتداد .js للموديلات المحلية إجباري
import { Subtask } from '../../models/Subtask.model.js';

// ── Create ─────────────────────────────────────────────────────────────────────
export const createSubtaskService = async (data) => {
    return await Subtask.create(data);
};

// ── Read ───────────────────────────────────────────────────────────────────────
export const getAllSubtasksByTaskService = async (taskId) => {
    return await Subtask.find({ taskId }).populate('assignee', 'name email');
};

export const getSubtaskByIdService = async (id) => {
    return await Subtask.findById(id).populate('assignee', 'name email');
};

// ── Update ─────────────────────────────────────────────────────────────────────
export const updateSubtaskService = async (id, data) => {
    return await Subtask.findByIdAndUpdate(id, data, { new: true, runValidators: true });
};

// ── Delete ─────────────────────────────────────────────────────────────────────
export const deleteSubtaskService = async (id) => {
    return await Subtask.findByIdAndDelete(id);
};

// تصدير كـ default object لسهولة الاستدعاء في الـ Controller عبر تنقيط الكائن
export default {
    createSubtaskService,
    getAllSubtasksByTaskService,
    getSubtaskByIdService,
    updateSubtaskService,
    deleteSubtaskService
};