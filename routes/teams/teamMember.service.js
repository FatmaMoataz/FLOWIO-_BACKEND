// إضافة امتداد .js للموديل المحلي إجباري
import { TeamMember } from '../../models/teamMember.model.js';

// ── Shared populate config ─────────────────────────────────────────────────────
const TEAM_MEMBER_POPULATE = [
    { path: 'userId', select: 'name email specialization role avatar' },
    { path: 'teamId', select: 'name companyId' }
];

// ── Add Member ─────────────────────────────────────────────────────────────────
export const addTeamMemberService = async (data) => {
    const member = await TeamMember.create(data);
    return await member.populate(TEAM_MEMBER_POPULATE);
};

// ── Read ───────────────────────────────────────────────────────────────────────
export const getMembersByTeamService = async (teamId) => {
    return await TeamMember.find({ teamId })
        .populate(TEAM_MEMBER_POPULATE)
        .sort({ joined_at: 1 });
};

export const getTeamsByUserService = async (userId) => {
    return await TeamMember.find({ userId })
        .populate(TEAM_MEMBER_POPULATE)
        .sort({ joined_at: -1 });
};

export const getTeamMemberByIdService = async (id) => {
    return await TeamMember.findById(id).populate(TEAM_MEMBER_POPULATE);
};

// ── Update Role ────────────────────────────────────────────────────────────────
export const updateTeamMemberRoleService = async (id, role_in_team) => {
    return await TeamMember.findByIdAndUpdate(
        id,
        { role_in_team },
        { new: true, runValidators: true }
    ).populate(TEAM_MEMBER_POPULATE);
};

// ── Remove Member ──────────────────────────────────────────────────────────────
export const removeTeamMemberService = async (id) => {
    return await TeamMember.findByIdAndDelete(id);
};

// كائن default لتوفير المرونة الكاملة عند الاستيراد في الـ controller
export default {
    addTeamMemberService,
    getMembersByTeamService,
    getTeamsByUserService,
    getTeamMemberByIdService,
    updateTeamMemberRoleService,
    removeTeamMemberService
};