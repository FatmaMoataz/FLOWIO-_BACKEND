import mongoose from 'mongoose';

const chatRoleEnum = {
  user:      'user',
  assistant: 'assistant'
};

const chatMessageSchema = new mongoose.Schema(
  {
    sessionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ChatSession',
      required: true
    },
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
    role: {
      type: String,
      enum: Object.values(chatRoleEnum),
      required: true
    },
    text: {
      type: String,
      required: true,
      trim: true
    },
    // Set true if the AI call failed and this is a fallback/error message
    isError: {
      type: Boolean,
      default: false
    }
  },
  {
    timestamps: true // createdAt acts as the message timestamp
  }
);

// Fast history lookups — sorted by time, scoped to session
chatMessageSchema.index({ sessionId: 1, createdAt: 1 });

const ChatMessage = mongoose.model('ChatMessage', chatMessageSchema);

export { ChatMessage, chatRoleEnum };