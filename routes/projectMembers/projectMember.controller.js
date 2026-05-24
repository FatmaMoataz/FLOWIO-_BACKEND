// إضافة امتداد .js للملفات والموديلات المحلية إجباري
import projectMemberService from './projectMember.service.js';
import { validateProjectMember, validateProjectMemberUpdate } from '../../models/projectMember.model.js';

// ── Helper ─────────────────────────────────────────────────────────────────────
const isValidObjectId = (id) => /^[0-9a-fA-F]{24}$/.test(id);

// ── Add Member to Project ──────────────────────────────────────────────────────
export const addMember = async (req, res) => {
    const { projectId } = req.params;

    if (!isValidObjectId(projectId)) {
        return res.status(400).json({ success: false, message: 'Invalid projectId in URL.' });
    }

    const { error } = validateProjectMember(req.body);
    if (error) {
        const messages = error.details.map(d => d.message);
        return res.status(400).json({ success: false, errors: messages });
    }

    try {
        const member = await projectMemberService.addMemberService({
            ...req.body,
            projectId // injected from URL — body cannot override
        });
        return res.status(201).json({ success: true, data: member });
    } catch (err) {
        // Handle duplicate — user already in this project
        if (err.code === 11000) {
            return res.status(409).json({
                success: false,
                message: 'This user is already a member of the project.'
            });
        }
        console.error('[addMember]', err);
        return res.status(500).json({ success: false, message: err.message });
    }
};

// ── Get All Members of a Project ───────────────────────────────────────────────
export const getMembersByProject = async (req, res) => {
    const { projectId } = req.params;

    if (!isValidObjectId(projectId)) {
        return res.status(400).json({ success: false, message: 'Invalid projectId in URL.' });
    }

    try {
        const members = await projectMemberService.getMembersByProjectService(projectId);
        return res.status(200).json({ success: true, data: members });
    } catch (err) {
        console.error('[getMembersByProject]', err);
        return res.status(500).json({ success: false, message: err.message });
    }
};

// ── Get All Projects a User Belongs To ────────────────────────────────────────
export const getProjectsByUser = async (req, res) => {
    const { userId } = req.params;

    if (!isValidObjectId(userId)) {
        return res.status(400).json({ success: false, message: 'Invalid userId in URL.' });
    }

    try {
        const projects = await projectMemberService.getProjectsByUserService(userId);
        return res.status(200).json({ success: true, data: projects });
    } catch (err) {
        console.error('[getProjectsByUser]', err);
        return res.status(500).json({ success: false, message: err.message });
    }
};

// ── Update Member Role ─────────────────────────────────────────────────────────
export const updateMemberRole = async (req, res) => {
    const { error } = validateProjectMemberUpdate(req.body);
    if (error) {
        const messages = error.details.map(d => d.message);
        return res.status(400).json({ success: false, errors: messages });
    }

    try {
        const member = await projectMemberService.updateMemberRoleService(
            req.params.memberId,
            req.body.role_in_project
        );
        if (!member) {
            return res.status(404).json({ success: false, message: 'Member not found.' });
        }
        return res.status(200).json({ success: true, data: member });
    } catch (err) {
        console.error('[updateMemberRole]', err);
        return res.status(400).json({ success: false, message: err.message });
    }
};

// ── Remove Member from Project ─────────────────────────────────────────────────
export const removeMember = async (req, res) => {
    try {
        const member = await projectMemberService.removeMemberService(req.params.memberId);
        if (!member) {
            return res.status(404).json({ success: false, message: 'Member not found.' });
        }
        return res.status(200).json({ success: true, message: 'Member removed from project.' });
    } catch (err) {
        console.error('[removeMember]', err);
        return res.status(500).json({ success: false, message: err.message });
    }
};