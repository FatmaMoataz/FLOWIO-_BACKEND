import crypto from 'crypto'; // مكتبة Node.js الأساسية مش محتاجة امتداد ملف
import { Invitation, invitationStatusEnum } from '../../models/invitation.js';

export const generateInvitationToken = () => {
  return crypto.randomBytes(32).toString('hex');
};

export const getPendingInvitationByEmailService = async (email) => {
  return await Invitation.findOne({ emailInvited: email, status: invitationStatusEnum.pending });
};

export const createInvitationService = async (data) => {
  return await Invitation.create(data);
};

export const getAllInvitationsService = async () => {
  return await Invitation.find();
};

export const getInvitationByIdService = async (id) => {
  return await Invitation.findById(id);
};

export const getInvitationByTokenService = async (token) => {
  return await Invitation.findOne({ token });
};

export const updateInvitationService = async (id, updateData) => {
  return await Invitation.findByIdAndUpdate(id, updateData, { new: true, runValidators: true });
};

export const deleteInvitationService = async (id) => {
  return await Invitation.findByIdAndDelete(id);
};

export const getMyInvitationsService = async (email) => {
  return await Invitation.find({
    emailInvited: email,
    status: invitationStatusEnum.pending,
    expiresAt: { $gt: new Date() }
  }).populate('companyId', 'name industry');
};

// كائن default عشان الـ controller بيستدعيه كـ كائن موحد (invitationService.method)
export default {
  generateInvitationToken,
  getPendingInvitationByEmailService,
  createInvitationService,
  getAllInvitationsService,
  getInvitationByIdService,
  getInvitationByTokenService,
  updateInvitationService,
  deleteInvitationService,
  getMyInvitationsService,
};