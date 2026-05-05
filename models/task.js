const mongoose = require('mongoose');
const Epic = require('./epic');
const taskSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Task title is required'],
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    status: {
      type: String,
      enum: ['To Do', 'In Progress', 'In Review', 'Done'],
      default: 'To Do',
    },
    priority: {
      type: String,
      enum: ['Low', 'Medium', 'High', 'Urgent'],
    },
    due_date: {
      type: Date,
    },
    // ── Relationships ──────────────────────────────────────────
    creator: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Task must have a creator'],
    },
    assignee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    epicId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Epic',
    },
    columnId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'KanbanColumn',
    },
  },
  {
    timestamps: true,
  }
);

const Task = mongoose.model('Task', taskSchema);

module.exports = Task;