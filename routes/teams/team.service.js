const { Team } = require('../../models/team.model');

// ── Shared populate config ─────────────────────────────────────────────────────
const TEAM_POPULATE = [
    { path: 'companyId', select: 'name industry' },
    { path: 'createdBy', select: 'name email' }
];

// ── Create ─────────────────────────────────────────────────────────────────────

const createTeamService = async (data) => {
    const team = await Team.create(data);
    return await team.populate(TEAM_POPULATE);
};

// ── Read ───────────────────────────────────────────────────────────────────────

const getAllTeamsByCompanyService = async (companyId) => {
    return await Team.find({ companyId })
        .populate(TEAM_POPULATE)
        .sort({ createdAt: -1 });
};

const getTeamByIdService = async (id) => {
    return await Team.findById(id).populate(TEAM_POPULATE);
};

// ── Update ─────────────────────────────────────────────────────────────────────

const updateTeamService = async (id, data) => {
    return await Team.findByIdAndUpdate(
        id,
        data,
        { new: true, runValidators: true }
    ).populate(TEAM_POPULATE);
};

// ── Delete ─────────────────────────────────────────────────────────────────────

const deleteTeamService = async (id) => {
    return await Team.findByIdAndDelete(id);
};

module.exports = {
    createTeamService,
    getAllTeamsByCompanyService,
    getTeamByIdService,
    updateTeamService,
    deleteTeamService
};