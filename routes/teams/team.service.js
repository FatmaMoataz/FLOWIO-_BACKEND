// إضافة امتداد .js للموديل المحلي إجباري
import { Team } from '../../models/team.model.js';

// ── Shared populate config ─────────────────────────────────────────────────────
const TEAM_POPULATE = [
    { path: 'companyId', select: 'name industry' },
    { path: 'createdBy', select: 'name email' }
];

// ── Create ─────────────────────────────────────────────────────────────────────
export const createTeamService = async (data) => {
    const team = await Team.create(data);
    return await team.populate(TEAM_POPULATE);
};

// ── Read ───────────────────────────────────────────────────────────────────────
export const getAllTeamsByCompanyService = async (companyId) => {
    return await Team.find({ companyId })
        .populate(TEAM_POPULATE)
        .sort({ createdAt: -1 });
};

export const getTeamByIdService = async (id) => {
    return await Team.findById(id).populate(TEAM_POPULATE);
};

// ── Update ─────────────────────────────────────────────────────────────────────
export const updateTeamService = async (id, data) => {
    return await Team.findByIdAndUpdate(
        id,
        data,
        { new: true, runValidators: true }
    ).populate(TEAM_POPULATE);
};

// ── Delete ─────────────────────────────────────────────────────────────────────
export const deleteTeamService = async (id) => {
    return await Team.findByIdAndDelete(id);
};

// كائن default موحد لتسهيل الاستدعاء
export default {
    createTeamService,
    getAllTeamsByCompanyService,
    getTeamByIdService,
    updateTeamService,
    deleteTeamService
};