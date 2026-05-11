const crypto = require('crypto');
const { Invitation, invitationStatusEnum } = require('../../models/invitation');

const generateInvitationToken = () => {
  return crypto.randomBytes(32).toString('hex');
};

const getPendingInvitationByEmailService = async (email) => {
  return await Invitation.findOne({ emailInvited: email, status: invitationStatusEnum.pending });
};

const createInvitationService = async (data) => {
  return await Invitation.create(data);
};

const getAllInvitationsService = async () => {
  return await Invitation.find();
};

const getInvitationByIdService = async (id) => {
  return await Invitation.findById(id);
};

const getInvitationByTokenService = async (token) => {
  return await Invitation.findOne({ token });
};

const updateInvitationService = async (id, updateData) => {
  return await Invitation.findByIdAndUpdate(id, updateData, { new: true, runValidators: true });
};

const deleteInvitationService = async (id) => {
  return await Invitation.findByIdAndDelete(id);
};

module.exports = {
  generateInvitationToken,
  getPendingInvitationByEmailService,
  createInvitationService,
  getAllInvitationsService,
  getInvitationByIdService,
  getInvitationByTokenService,
  updateInvitationService,
  deleteInvitationService,
};
