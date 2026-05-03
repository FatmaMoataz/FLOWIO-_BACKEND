const mongoose = require('mongoose');

const invitationStatusEnum = {
  pending: 'pending',
  accepted: 'accepted',
  rejected: 'rejected',
};

const invitationSchema = new mongoose.Schema({
  status: {
    type: String,
    required: true,
    enum: Object.values(invitationStatusEnum),
    default: invitationStatusEnum.pending,
  },
  token: {
    type: String,
    required: true,
    unique: true,
  },
  emailInvited: {
    type: String,
    required: true,
    match: [/^\S+@\S+\.\S+$/, 'Please use a valid email address'],
  },
  expiresAt: {
    type: Date,
    default: () => new Date(Date.now() + 24 * 60 * 60 * 1000),
  },
}, {
  timestamps: true,
  toObject: { virtuals: true },
  toJSON: { virtuals: true },
});

const Invitation = mongoose.model('Invitation', invitationSchema);

module.exports = {
  Invitation,
  invitationStatusEnum,
};
