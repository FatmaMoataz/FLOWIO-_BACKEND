import mongoose from 'mongoose';
import Joi from 'joi';

const storyStatusEnum = {
  TODO: 'To Do',
  IN_PROGRESS: 'In Progress',
  REVIEW: 'Review',
  DONE: 'Done'
};

const storySchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Story title is required'],
      trim: true,
      minLength: [2, 'Story title must be at least 2 characters'],
      maxLength: [200, 'Story title cannot exceed 200 characters']
    },
    description: {
      type: String,
      trim: true,
      maxLength: [1000, 'Description cannot exceed 1000 characters']
    },
    status: {
      type: String,
      enum: Object.values(storyStatusEnum),
      default: storyStatusEnum.TODO
    },
    priority: {
      type: String,
      enum: ['Low', 'Medium', 'High', 'Urgent'],
      default: 'Medium'
    },
    epicId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Epic',
      required: [true, 'Epic reference is required']
    },
    projectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Project',
      required: [true, 'Project reference is required']
    },
    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Company',
      required: [true, 'Company reference is required']
    },
    assignee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    },
    dueDate: {
      type: Date,
      default: null
    },
    order: {
      type: Number,
      default: 0
    },
    tags: [{
      type: String,
      trim: true
    }]
  },
  {
    timestamps: true,
    toObject: { virtuals: true },
    toJSON: { virtuals: true }
  }
);

// Virtual for getting all subtasks of this story
storySchema.virtual('subtasks', {
  ref: 'Subtask',
  localField: '_id',
  foreignField: 'storyId'
});

const Story = mongoose.models.Story || mongoose.model('Story', storySchema);

// ── Joi Validation ─────────────────────────────────────────────────────────
function validateStory(data) {
  const schema = Joi.object({
    title: Joi.string().min(2).max(200).required().messages({
      'string.empty': 'Story title is required.',
      'any.required': 'Story title is required.'
    }),
    description: Joi.string().max(1000).optional().allow(''),
    status: Joi.string()
      .valid(...Object.values(storyStatusEnum))
      .optional(),
    priority: Joi.string()
      .valid('Low', 'Medium', 'High', 'Urgent')
      .optional(),
    epicId: Joi.string().hex().length(24).required().messages({
      'string.hex': 'epicId must be a valid MongoDB ObjectId.',
      'any.required': 'epicId is required.'
    }),
    projectId: Joi.string().hex().length(24).required().messages({
      'string.hex': 'projectId must be a valid MongoDB ObjectId.',
      'any.required': 'projectId is required.'
    }),
    companyId: Joi.string().hex().length(24).required().messages({
      'string.hex': 'companyId must be a valid MongoDB ObjectId.',
      'any.required': 'companyId is required.'
    }),
    assignee: Joi.string().hex().length(24).optional().allow(null),
    dueDate: Joi.date().iso().optional().allow(null),
    order: Joi.number().optional(),
    tags: Joi.array().items(Joi.string()).optional()
  });

  return schema.validate(data, { abortEarly: false });
}

function validateStoryUpdate(data) {
  const schema = Joi.object({
    title: Joi.string().min(2).max(200).optional(),
    description: Joi.string().max(1000).optional().allow(''),
    status: Joi.string()
      .valid(...Object.values(storyStatusEnum))
      .optional(),
    priority: Joi.string()
      .valid('Low', 'Medium', 'High', 'Urgent')
      .optional(),
    assignee: Joi.string().hex().length(24).optional().allow(null),
    dueDate: Joi.date().iso().optional().allow(null),
    order: Joi.number().optional(),
    tags: Joi.array().items(Joi.string()).optional()
  });

  return schema.validate(data, { abortEarly: false });
}

export { Story, storyStatusEnum, validateStory, validateStoryUpdate };