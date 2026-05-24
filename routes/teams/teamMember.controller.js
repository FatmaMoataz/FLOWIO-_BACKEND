// إضافة امتداد .js للملفات والموديلات المحلية إجباري
import teamMemberService from './teamMember.service.js';
import { validateTeamMember, validateTeamMemberUpdate } from '../../models/teamMember.model.js';

// ── Helper ─────────────────────────────────────────────────────────────────────
const isValidObjectId = (id) => /^[0-9a-fA-F]{24}$/.test(id);

// ── Add Member to Team ─────────────────────────────────────────────────────────
export const addTeamMember = async (req, res) => {
    const { teamId } = req.params;

    if (!isValidObjectId(teamId)) {
        return res.status(400).json({ success: false, message: 'Invalid teamId in URL.' });
    }

    const { error } = validateTeamMember(req.body);
    if (error) {
        const messages = error.details.map(d => d.message);
        return res.status(400).json({ success: false, errors: messages });
    }

    try {
        const member = await teamMemberService.addTeamMemberService({
            ...req.body,
            teamId // injected from URL — body cannot override
        });
        return res.status(201).json({ success: true, data: member });
    } catch (err) {
        if (err.code === 11000) {
            return res.status(409).json({
                success: false,
                message: 'This user is already a member of the team.'
            });
        }
        console.error('[addTeamMember]', err);
        return res.status(500).json({ success: false, message: err.message });
    }
};

// ── Get All Members of a Team ──────────────────────────────────────────────────
export const getMembersByTeam = async (req, res) => {
    const { teamId } = req.params;

    if (!isValidObjectId(teamId)) {
        return res.status(400).json({ success: false, message: 'Invalid teamId in URL.' });
    }

    try {
        const members = await teamMemberService.getMembersByTeamService(teamId);
        return res.status(200).json({ success: true, data: members });
    } catch (err) {
        console.error('[getMembersByTeam]', err);
        return res.status(500).json({ success: false, message: err.message });
    }
};

// ── Update Member Role ─────────────────────────────────────────────────────────
export const updateTeamMemberRole = async (req, res) => {
    const { error } = validateTeamMemberUpdate(req.body);
    if (error) {
        const messages = error.details.map(d => d.message);
        return res.status(400).json({ success: false, errors: messages });
    }

    try {
        const member = await teamMemberService.updateTeamMemberRoleService(
            req.params.memberId,
            req.body.role_in_team
        );
        if (!member) {
            return res.status(404).json({ success: false, message: 'Team member not found.' });
        }
        return res.status(200).json({ success: true, data: member });
    } catch (err) {
        console.error('[updateTeamMemberRole]', err);
        return res.status(400).json({ success: false, message: err.message });
    }
};

// ── Remove Member from Team ────────────────────────────────────────────────────
export const removeTeamMember = async (req, res) => {
    try {
        const member = await teamMemberService.removeTeamMemberService(req.params.memberId);
        if (!member) {
            return res.status(404).json({ success: false, message: 'Team member not found.' });
        }
        return res.status(200).json({ success: true, message: 'Member removed from team.' });
    } catch (err) {
        console.error('[removeTeamMember]', err);
        return res.status(500).json({ success: false, message: err.message });
    }
};