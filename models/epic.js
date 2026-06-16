import mongoose from 'mongoose';

const epicSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Epic name is required'],
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    status: {
      type: String,
      enum: ['To Do', 'In Progress', 'Done'],
      default: 'To Do',
    },
    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Company',
      required: [true, 'Company reference is required'],
    },
    // ✅ FIX 1: Added projectId so epics are linked to their project
    projectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Project',
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

const Epic = mongoose.model('Epic', epicSchema);

export default Epic;