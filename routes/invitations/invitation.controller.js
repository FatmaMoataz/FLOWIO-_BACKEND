import invitationService from './invitation.service.js';
import { invitationStatusEnum } from '../../models/invitation.js';
import { User } from '../../models/user.js';
import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,   // same vars your friend already uses
    pass: process.env.EMAIL_PASSWORD,
  },
});

export const createInvitation = async (req, res) => {
  try {
    const existing = await invitationService.getPendingInvitationByEmailService(req.body.emailInvited);
    if (existing) {
      return res.status(400).json({ success: false, message: 'An active invitation already exists for this email' });
    }

    const token = invitationService.generateInvitationToken();
    const invitation = await invitationService.createInvitationService({
      emailInvited: req.body.emailInvited,
      companyId: req.body.companyId,
      token,
      status: invitationStatusEnum.pending,
    });

    // Send the email — fire and forget, don't block the response
    const inviteUrl = `${process.env.FRONTEND_URL}/invite/accept/${token}`;
    transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: invitation.emailInvited,
      subject: "You've been invited to Flowio",
      html: `
        <h2>You're invited!</h2>
        <p>Click the link below to join your team on Flowio.</p>
        <a href="${inviteUrl}" style="padding:12px 24px;background:#245df5;color:#fff;border-radius:8px;text-decoration:none;font-weight:bold">
          Accept Invitation
        </a>
        <p>This link expires in <strong>24 hours</strong>.</p>
        <p style="color:#888;font-size:12px">If you didn't expect this, you can safely ignore it.</p>
      `,
    }).catch(err => console.error('[invitation email]', err));

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