import invitationService from './invitation.service.js';
import { invitationStatusEnum } from '../../models/invitation.js';
import { User } from '../../models/user.js'; // طلعنا الـ import فوق لـ clean architecture أفضل

export const createInvitation = async (req, res) => {
  try {
    const existing = await invitationService.getPendingInvitationByEmailService(req.body.emailInvited);
    if (existing) {
      return res.status(400).json({ success: false, message: 'An active invitation already exists for this email' });
    }

    const token = invitationService.generateInvitationToken();
    const invitation = await invitationService.createInvitationService({
      emailInvited: req.body.emailInvited,
      companyId: req.body.companyId, // التعديل بتاعك موجود هنا تمام وزي الفل
      token,
      status: invitationStatusEnum.pending,
    });

    res.status(201).json({ success: true, data: invitation });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const handleInvitationResponse = async (req, res) => {
  try {
    const token = req.params.token;
    const status = req.path.includes('accept')
      ? invitationStatusEnum.accepted
      : invitationStatusEnum.rejected;

    const invitation = await invitationService.getInvitationByTokenService(token);
    if (!invitation) {
      return res.status(404).json({ success: false, message: 'Invalid invitation token' });
    }

    if (invitation.expiresAt < Date.now()) {
      return res.status(400).json({ success: false, message: 'Invitation expired' });
    }

    if (invitation.status !== invitationStatusEnum.pending) {
      return res.status(400).json({ success: false, message: 'Already used' });
    }

    const updated = await invitationService.updateInvitationService(invitation._id, { status });
    return res.status(200).json({ success: true, message: `Invitation ${status}`, data: updated });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const getAllInvitations = async (req, res) => {
  try {
    const invitations = await invitationService.getAllInvitationsService();
    res.status(200).json({ success: true, data: invitations });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getInvitationById = async (req, res) => {
  try {
    const invitation = await invitationService.getInvitationByIdService(req.params.id);
    if (!invitation) {
      return res.status(404).json({ success: false, message: 'Invitation not found' });
    }
    return res.status(200).json({ success: true, data: invitation });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getInvitationByToken = async (req, res) => {
  try {
    const invitation = await invitationService.getInvitationByTokenService(req.params.token);
    if (!invitation) {
      return res.status(404).json({ success: false, message: 'Invalid invitation token' });
    }
    if (invitation.status !== invitationStatusEnum.pending) {
      return res.status(400).json({ success: false, message: 'Invitation is not pending' });
    }
    res.status(200).json({ success: true, data: invitation });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateInvitation = async (req, res) => {
  try {
    const existingInvitation = await invitationService.getInvitationByIdService(req.params.id);
    if (!existingInvitation) {
      return res.status(404).json({ success: false, message: 'Invitation not found' });
    }

    if (existingInvitation.status !== invitationStatusEnum.pending) {
      return res.status(400).json({ success: false, message: 'Cannot update invitation after it is used' });
    }

    if (req.body.status && !Object.values(invitationStatusEnum).includes(req.body.status)) {
      return res.status(400).json({ success: false, message: 'Invalid status value' });
    }

    const updatedInvitation = await invitationService.updateInvitationService(req.params.id, {
      emailInvited: req.body.emailInvited,
    });

    return res.status(200).json({ success: true, data: updatedInvitation });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const deleteInvitation = async (req, res) => {
  try {
    const invitation = await invitationService.deleteInvitationService(req.params.id);
    if (!invitation) {
      return res.status(404).json({ success: false, message: 'Invitation not found' });
    }
    return res.status(200).json({ success: true, message: 'Invitation deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/invitations/my
export const getMyInvitations = async (req, res) => {
  try {
    const currentUser = await User.findById(req.user._id).select('email');
    if (!currentUser) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }
    const invitations = await invitationService.getMyInvitationsService(currentUser.email);
    return res.status(200).json({ success: true, data: invitations });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};