import mongoose from 'mongoose';
import Joi from 'joi';

const chatSessionSchema = new mongoose.Schema(
  {
    projectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Project',
      required: true
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    title: {
      type: String,
      trim: true,
      default: function () {
        return `Chat — ${new Date().toLocaleDateString()}`;
      }
    },
    lastMessageAt: {
      type: Date,
      default: Date.now
    },
    messageCount: {
      type: Number,
      default: 0
    }
  },
  {
    timestamps: true
  }
);

// One session per (user, project) pair — keeps history scoped correctly
chatSessionSchema.index({ projectId: 1, userId: 1 }, { unique: true });

const ChatSession = mongoose.model('ChatSession', chatSessionSchema);

// ── Joi Validators ────────────────────────────────────────────────────────────

function validateChatMessageInput(data) {
  const schema = Joi.object({
    projectId: Joi.string().hex().length(24).required().messages({
      'any.required': 'projectId is required',
      'string.hex':   'projectId must be a valid ObjectId'
    }),
    message: Joi.string().trim().min(1).max(2000).required().messages({
      'any.required':  'message is required',
      'string.empty':  'message cannot be empty'
    })
  });
  return schema.validate(data, { abortEarly: false });
}

export { ChatSession, validateChatMessageInput };