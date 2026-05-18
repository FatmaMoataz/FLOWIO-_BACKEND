const { TeamMember } = require('../../models/teamMember.model');

// ── Shared populate config ─────────────────────────────────────────────────────
const TEAM_MEMBER_POPULATE = [
    { path: 'userId', select: 'name email specialization' },
    { path: 'teamId', select: 'name companyId' }
];

// ── Add Member ─────────────────────────────────────────────────────────────────

const addTeamMemberService = async (data) => {
    const member = await TeamMember.create(data);
    return await member.populate(TEAM_MEMBER_POPULATE);
};

// ── Read ───────────────────────────────────────────────────────────────────────

const getMembersByTeamService = async (teamId) => {
    return await TeamMember.find({ teamId })
        .populate(TEAM_MEMBER_POPULATE)
        .sort({ joined_at: 1 });
};

const getTeamsByUserService = async (userId) => {
    return await TeamMember.find({ userId })
        .populate(TEAM_MEMBER_POPULATE)
        .sort({ joined_at: -1 });
};

const getTeamMemberByIdService = async (id) => {
    return await TeamMember.findById(id).populate(TEAM_MEMBER_POPULATE);
};

// ── Update Role ────────────────────────────────────────────────────────────────

const updateTeamMemberRoleService = async (id, role_in_team) => {
    return await TeamMember.findByIdAndUpdate(
        id,
        { role_in_team },
        { new: true, runValidators: true }
    ).populate(TEAM_MEMBER_POPULATE);
};

// ── Remove Member ──────────────────────────────────────────────────────────────

const removeTeamMemberService = async (id) => {
    return await TeamMember.findByIdAndDelete(id);
};

module.exports = {
    addTeamMemberService,
    getMembersByTeamService,
    getTeamsByUserService,
    getTeamMemberByIdService,
    updateTeamMemberRoleService,
    removeTeamMemberService
};