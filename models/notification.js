import mongoose from 'mongoose';

const notificationTypesEnum = {
  SYSTEM: "SYSTEM",
  TASK_ASSIGNED: "TASK_ASSIGNED",
  TASK_UPDATED: "TASK_UPDATED",
  COMMENT: "COMMENT",
  LIKE: "LIKE",
  MENTION: "MENTION",
  POLLS: "POLLS"
};

const notificationSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      minLength: [3, "Title must be at least 3 characters"],
      maxLength: [50, "Title cannot exceed 50 characters"],
    },

    message: {
      type: String,
      required: true,
      minLength: [10, "Message must be at least 10 characters"],
      maxLength: [200, "Message cannot exceed 200 characters"],
    },

    type: {
      type: String,
      enum: Object.values(notificationTypesEnum),
      required: true,
    },

    is_read: {
      type: Boolean,
      default: false,
    },

    read_at: {
      type: Date,
      default: null,
    },

    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    fromUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },

    // مهم جدًا في project management
    referenceId: {
      type: mongoose.Schema.Types.ObjectId,
    },

    referenceModel: {
      type: String, // "Task", "Post", "Poll"
    },
  },
  {
    timestamps: true,
  }
);

const Notification = mongoose.model('Notification', notificationSchema);

export default Notification;