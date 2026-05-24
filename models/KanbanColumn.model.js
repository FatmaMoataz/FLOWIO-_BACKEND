import mongoose from 'mongoose';
import Joi from 'joi';

const columnStatusEnum = ['To Do', 'In Progress', 'In Review', 'Done'];

const kanbanColumnSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Column name is required'],
      trim: true
    },
    status: {
      type: String,
      required: [true, 'Column status is required'],
      enum: columnStatusEnum
    },
    order: {
      type: Number,
      required: [true, 'Column order is required']
    },
    boardId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Board',
      required: [true, 'Board reference is required']
    },
    tasks: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Task'
      }
    ]
  },
  {
    timestamps: true
  }
);

const KanbanColumn = mongoose.model('KanbanColumn', kanbanColumnSchema);

// ── Joi Validators ────────────────────────────────────────────────────────────

function validateColumn(data) {
  const schema = Joi.object({
    name:   Joi.string().min(1).max(100).required(),
    status: Joi.string().valid(...columnStatusEnum).required(),
    order:  Joi.number().integer().min(0).required()
  });
  return schema.validate(data, { abortEarly: false });
}

function validateColumnUpdate(data) {
  const schema = Joi.object({
    name:   Joi.string().min(1).max(100),
    status: Joi.string().valid(...columnStatusEnum),
    order:  Joi.number().integer().min(0)
  }).min(1); // at least one field required
  return schema.validate(data, { abortEarly: false });
}

function validateReorder(data) {
  const schema = Joi.object({
    // Array of { columnId, order } pairs
    columns: Joi.array().items(
      Joi.object({
        columnId: Joi.string().hex().length(24).required(),
        order:    Joi.number().integer().min(0).required()
      })
    ).min(1).required()
  });
  return schema.validate(data, { abortEarly: false });
}

export { KanbanColumn, columnStatusEnum, validateColumn, validateColumnUpdate, validateReorder };