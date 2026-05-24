// إضافة امتداد .js للموديلات المحلية إجباري
import { ProjectMember } from '../../models/projectMember.model.js';

// ── Shared populate config ─────────────────────────────────────────────────────
const MEMBER_POPULATE = [
    { path: 'userId',    select: 'name email specialization' },
    { path: 'projectId', select: 'name status' }
];

// ── Add Member to Project ──────────────────────────────────────────────────────
export const addMemberService = async (data) => {
    const member = await ProjectMember.create(data);
    return await member.populate(MEMBER_POPULATE);
};

// ── Get All Members of a Project ───────────────────────────────────────────────
export const getMembersByProjectService = async (projectId) => {
    return await ProjectMember.find({ projectId })
        .populate(MEMBER_POPULATE)
        .sort({ joined_at: 1 }); // oldest members first
};

// ── Get All Projects a User Belongs To ────────────────────────────────────────
export const getProjectsByUserService = async (userId) => {
    return await ProjectMember.find({ userId })
        .populate(MEMBER_POPULATE)
        .sort({ joined_at: -1 });
};

// ── Get Single Member Entry ────────────────────────────────────────────────────
export const getMemberByIdService = async (id) => {
    return await ProjectMember.findById(id).populate(MEMBER_POPULATE);
};

// ── Update Member Role ─────────────────────────────────────────────────────────
export const updateMemberRoleService = async (id, role_in_project) => {
    return await ProjectMember.findByIdAndUpdate(
        id,
        { role_in_project },
        { new: true, runValidators: true }
    ).populate(MEMBER_POPULATE);
};

// ── Remove Member from Project ─────────────────────────────────────────────────
export const removeMemberService = async (id) => {
    return await ProjectMember.findByIdAndDelete(id);
};

// ── Check if User is Already a Member ─────────────────────────────────────────
export const isMemberService = async (userId, projectId) => {
    const member = await ProjectMember.findOne({ userId, projectId });
    return !!member;
};

// عمل export default هنا أيضاً ليسهل استدعاؤه ككائن موحد في الـ controller
export default {
    addMemberService,
    getMembersByProjectService,
    getProjectsByUserService,
    getMemberByIdService,
    updateMemberRoleService,
    removeMemberService,
    isMemberService
};