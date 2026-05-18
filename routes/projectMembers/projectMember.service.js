const { ProjectMember } = require('../../models/projectMember.model');

// ── Shared populate config ─────────────────────────────────────────────────────
const MEMBER_POPULATE = [
    { path: 'userId',    select: 'name email specialization' },
    { path: 'projectId', select: 'name status' }
];

// ── Add Member to Project ──────────────────────────────────────────────────────

const addMemberService = async (data) => {
    // Will throw E11000 duplicate key error if user already in project
    // — caught and handled in the controller
    const member = await ProjectMember.create(data);
    return await member.populate(MEMBER_POPULATE);
};

// ── Get All Members of a Project ───────────────────────────────────────────────

const getMembersByProjectService = async (projectId) => {
    return await ProjectMember.find({ projectId })
        .populate(MEMBER_POPULATE)
        .sort({ joined_at: 1 }); // oldest members first
};

// ── Get All Projects a User Belongs To ────────────────────────────────────────

const getProjectsByUserService = async (userId) => {
    return await ProjectMember.find({ userId })
        .populate(MEMBER_POPULATE)
        .sort({ joined_at: -1 });
};

// ── Get Single Member Entry ────────────────────────────────────────────────────

const getMemberByIdService = async (id) => {
    return await ProjectMember.findById(id).populate(MEMBER_POPULATE);
};

// ── Update Member Role ─────────────────────────────────────────────────────────

const updateMemberRoleService = async (id, role_in_project) => {
    return await ProjectMember.findByIdAndUpdate(
        id,
        { role_in_project },
        { new: true, runValidators: true }
    ).populate(MEMBER_POPULATE);
};

// ── Remove Member from Project ─────────────────────────────────────────────────

const removeMemberService = async (id) => {
    return await ProjectMember.findByIdAndDelete(id);
};

// ── Check if User is Already a Member ─────────────────────────────────────────

const isMemberService = async (userId, projectId) => {
    const member = await ProjectMember.findOne({ userId, projectId });
    return !!member;
};

module.exports = {
    addMemberService,
    getMembersByProjectService,
    getProjectsByUserService,
    getMemberByIdService,
    updateMemberRoleService,
    removeMemberService,
    isMemberService
};