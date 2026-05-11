const invitationService = require('./invitation.service');
const { invitationStatusEnum } = require('../../models/invitation');

const createInvitation = async (req, res) => {
  try {
    const existing = await invitationService.getPendingInvitationByEmailService(req.body.emailInvited);
    if (existing) {
      return res.status(400).json({ success: false, message: 'An active invitation already exists for this email' });
    }

    const token = invitationService.generateInvitationToken();
    const invitation = await invitationService.createInvitationService({
      emailInvited: req.body.emailInvited,
      companyId: req.body.companyId, // <--- السطر ده اللي ناقص ومسبب الـ 400!
      token,
      status: invitationStatusEnum.pending,
    });

    res.status(201).json({ success: true, data: invitation });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

const handleInvitationResponse = async (req, res) => {
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

const getAllInvitations = async (req, res) => {
  try {
    const invitations = await invitationService.getAllInvitationsService();
    res.status(200).json({ success: true, data: invitations });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getInvitationById = async (req, res) => {
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

const getInvitationByToken = async (req, res) => {
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

const updateInvitation = async (req, res) => {
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

const deleteInvitation = async (req, res) => {
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

module.exports = {
  createInvitation,
  handleInvitationResponse,
  getAllInvitations,
  getInvitationById,
  getInvitationByToken,
  updateInvitation,
  deleteInvitation,
};
