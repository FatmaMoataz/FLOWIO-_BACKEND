import mongoose from 'mongoose';

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
  //i added companyId to link the invitation to a specific company, which is essential for managing invitations within the context of a company in the application.
companyId:{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company',
    required: true
}
}, {
  timestamps: true,
  toObject: { virtuals: true },
  toJSON: { virtuals: true },
},
);

const Invitation = mongoose.model('Invitation', invitationSchema);

export { Invitation, invitationStatusEnum };
