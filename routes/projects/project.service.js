// إضافة امتداد .js للموديلات المحلية إجباري
import { Project } from '../../models/project.model.js';

// ── Create ─────────────────────────────────────────────────────────────────────
export const createProjectService = async (data) => {
    const project = await Project.create(data);
    return project;
};

// ── Read ───────────────────────────────────────────────────────────────────────
export const getAllProjectsByCompanyService = async (companyId) => {
    return await Project.find({ companyId }).populate('companyId', 'name industry');
};

export const getProjectByIdService = async (id) => {
    return await Project.findById(id).populate('companyId', 'name industry');
};

// ── Update ─────────────────────────────────────────────────────────────────────
export const updateProjectService = async (id, data) => {
    return await Project.findByIdAndUpdate(id, data, { new: true, runValidators: true });
};

// ── Delete ─────────────────────────────────────────────────────────────────────
export const deleteProjectService = async (id) => {
    return await Project.findByIdAndDelete(id);
};

// تصدير كـ default object لسهولة الاستدعاء في الـ Controller عبر تنقيط الكائن
export default {
    createProjectService,
    getAllProjectsByCompanyService,
    getProjectByIdService,
    updateProjectService,
    deleteProjectService
};