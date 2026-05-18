const teamService = require('./team.service');
const { validateTeam, validateTeamUpdate } = require('../../models/team.model');

// ── Helper ─────────────────────────────────────────────────────────────────────
const isValidObjectId = (id) => /^[0-9a-fA-F]{24}$/.test(id);

// ── Create Team ────────────────────────────────────────────────────────────────
// createdBy → injected from req.user._id (auth middleware)
// companyId → from req.body (validated by Joi)

const createTeam = async (req, res) => {
    const { error } = validateTeam(req.body);
    if (error) {
        const messages = error.details.map(d => d.message);
        return res.status(400).json({ success: false, errors: messages });
    }

    try {
        const team = await teamService.createTeamService({
            ...req.body,
            createdBy: req.user._id // injected from auth — never from body
        });
        return res.status(201).json({ success: true, data: team });
    } catch (err) {
        console.error('[createTeam]', err);
        return res.status(500).json({ success: false, message: err.message });
    }
};

// ── Get All Teams by Company ───────────────────────────────────────────────────

const getAllTeamsByCompany = async (req, res) => {
    const { companyId } = req.params;

    if (!isValidObjectId(companyId)) {
        return res.status(400).json({ success: false, message: 'Invalid companyId in URL.' });
    }

    try {
        const teams = await teamService.getAllTeamsByCompanyService(companyId);
        return res.status(200).json({ success: true, data: teams });
    } catch (err) {
        console.error('[getAllTeamsByCompany]', err);
        return res.status(500).json({ success: false, message: err.message });
    }
};

// ── Get Team by ID ─────────────────────────────────────────────────────────────

const getTeamById = async (req, res) => {
    try {
        const team = await teamService.getTeamByIdService(req.params.id);
        if (!team) {
            return res.status(404).json({ success: false, message: 'Team not found.' });
        }
        return res.status(200).json({ success: true, data: team });
    } catch (err) {
        console.error('[getTeamById]', err);
        return res.status(500).json({ success: false, message: err.message });
    }
};

// ── Update Team ────────────────────────────────────────────────────────────────

const updateTeam = async (req, res) => {
    if (!req.body || Object.keys(req.body).length === 0) {
        return res.status(400).json({ success: false, message: 'No data provided for update.' });
    }

    const { error } = validateTeamUpdate(req.body);
    if (error) {
        const messages = error.details.map(d => d.message);
        return res.status(400).json({ success: false, errors: messages });
    }

    try {
        const team = await teamService.updateTeamService(req.params.id, req.body);
        if (!team) {
            return res.status(404).json({ success: false, message: 'Team not found.' });
        }
        return res.status(200).json({ success: true, data: team });
    } catch (err) {
        console.error('[updateTeam]', err);
        return res.status(400).json({ success: false, message: err.message });
    }
};

// ── Delete Team ────────────────────────────────────────────────────────────────

const deleteTeam = async (req, res) => {
    try {
        const team = await teamService.deleteTeamService(req.params.id);
        if (!team) {
            return res.status(404).json({ success: false, message: 'Team not found.' });
        }
        return res.status(200).json({ success: true, message: 'Team deleted successfully.' });
    } catch (err) {
        console.error('[deleteTeam]', err);
        return res.status(500).json({ success: false, message: err.message });
    }
};

module.exports = { createTeam, getAllTeamsByCompany, getTeamById, updateTeam, deleteTeam };