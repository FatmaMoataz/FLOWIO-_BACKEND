// إضافة امتداد .js للموديلات المحلية
import { Project } from '../../models/project.model.js';
import { Task } from '../../models/task.model.js';

// ── Archive Project ───────────────────────────────────────────────────────────
export const archiveProjectService = async (projectId) => {
    return await Project.findByIdAndUpdate(
        projectId,
        { isArchived: true, archivedAt: new Date(), status: 'archived' },
        { new: true }
    );
};

// ── Archive Task ──────────────────────────────────────────────────────────────
export const archiveTaskService = async (taskId) => {
    return await Task.findByIdAndUpdate(
        taskId,
        { isArchived: true, archivedAt: new Date() },
        { new: true }
    );
};

// ── Get All Archived Items for a Company ──────────────────────────────────────
export const getArchivedByCompanyService = async (companyId) => {
    const [projects, tasks] = await Promise.all([
        Project.find({ companyId, isArchived: true }).sort({ archivedAt: -1 }),
        Task.find({ isArchived: true })
            .populate({ path: 'projectId', match: { companyId }, select: 'name companyId' })
            .sort({ archivedAt: -1 })
    ]);

    // Filter out tasks whose project doesn't belong to this company
    // (populate returns null for non-matching projectId)
    const filteredTasks = tasks.filter(t => t.projectId !== null);

    return { projects, tasks: filteredTasks };
};

// ── Restore (unarchive) Project or Task ───────────────────────────────────────
export const restoreProjectService = async (id) => {
    return await Project.findByIdAndUpdate(
        id,
        { isArchived: false, archivedAt: null, status: 'active' },
        { new: true }
    );
};

export const restoreTaskService = async (id) => {
    return await Task.findByIdAndUpdate(
        id,
        { isArchived: false, archivedAt: null },
        { new: true }
    );
};