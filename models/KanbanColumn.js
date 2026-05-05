const mongoose = require('mongoose');
const kanbanColumnSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Column name is required'],
      trim: true,
    },
    status: {
      type: String,
      required: [true, 'Column status is required'],
      enum: ['To Do', 'In Progress', 'In Review', 'Done'],
    },
    order: {
      type: Number,
      required: [true, 'Column order is required'],
    },
    boardId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Board',
      required: [true, 'Board reference is required'],
    },
  },
  {
    timestamps: true,
  }
);

const KanbanColumn = mongoose.model('KanbanColumn', kanbanColumnSchema);

module.exports = KanbanColumn;
