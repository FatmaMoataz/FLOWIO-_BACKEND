import mongoose from 'mongoose';
import Joi from 'joi';

const boardSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Board name is required'],
      trim: true,
      minLength: [2, 'Board name must be at least 2 characters'],
      maxLength: [100, 'Board name cannot exceed 100 characters']
    },
    projectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Project',
      required: [true, 'Project reference is required'],
      unique: true // one board per project
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    }
  },
  {
    timestamps: true,
    toObject: { virtuals: true },
    toJSON: { virtuals: true }
  }
);

// Virtual — populate columns when fetching a board
boardSchema.virtual('columns', {
  ref: 'KanbanColumn',
  localField: '_id',
  foreignField: 'boardId',
  options: { sort: { order: 1 } } // always return columns sorted by order
});

const Board = mongoose.model('Board', boardSchema);

// ── Joi Validators ────────────────────────────────────────────────────────────

function validateBoard(data) {
  const schema = Joi.object({
    name: Joi.string().min(2).max(100).required(),
    projectId: Joi.string().hex().length(24).required().messages({
      'any.required': 'projectId is required',
      'string.hex': 'projectId must be a valid ObjectId'
    })
  });
  return schema.validate(data, { abortEarly: false });
}

function validateBoardUpdate(data) {
  const schema = Joi.object({
    name: Joi.string().min(2).max(100).required()
  });
  return schema.validate(data, { abortEarly: false });
}

export { Board, validateBoard, validateBoardUpdate };