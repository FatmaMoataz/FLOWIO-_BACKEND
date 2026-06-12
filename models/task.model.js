import mongoose from 'mongoose';
import Joi from 'joi';

const taskStatusEnum   = { todo: 'todo', inProgress: 'in-progress', review: 'review', done: 'done' };
const taskPriorityEnum = { low: 'low', medium: 'medium', high: 'high' };

const taskSchema = new mongoose.Schema(
    {
        title: {
            type: String,
            required: true,
            trim: true,
            minLength: [2,   'Task title must be at least 2 characters long'],
            maxLength: [100, 'Task title cannot exceed 100 characters']
        },
        description: {
            type: String,
            trim: true,
            maxLength: [500, 'Description cannot exceed 500 characters']
        },
        projectId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Project',
            default: null   // ← optional now; null = personal task
        },
        assignedTo: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            default: null
        },
        status: {
            type: String,
            enum: Object.values(taskStatusEnum),
            default: taskStatusEnum.todo
        },
        priority: {
            type: String,
            enum: Object.values(taskPriorityEnum),
            default: taskPriorityEnum.medium
        },
        deadline: { type: Date },
        isArchived: { type: Boolean, default: false },
        archivedAt: { type: Date,    default: null  }
    },
    {
        timestamps: true,
        toObject: { virtuals: true },
        toJSON:   { virtuals: true }
    }
);

const Task = mongoose.model('Task', taskSchema);

// ── Joi Validation ─────────────────────────────────────────────────────────────

function validateTask(data) {
    const schema = Joi.object({
        title:       Joi.string().min(2).max(100).required(),
        description: Joi.string().max(500).optional().allow(''),
        // projectId intentionally excluded — injected from req.params OR null for personal tasks
        assignedTo:  Joi.string().hex().length(24).optional().allow(null),
        status:      Joi.string().valid(...Object.values(taskStatusEnum)).optional(),
        priority:    Joi.string().valid(...Object.values(taskPriorityEnum)).optional(),
        deadline:    Joi.date().iso().optional().messages({ 'date.format': 'deadline must be a valid ISO 8601 date' })
    });
    return schema.validate(data, { abortEarly: false });
}

function validateTaskUpdate(data) {
    const schema = Joi.object({
        title:       Joi.string().min(2).max(100).optional(),
        description: Joi.string().max(500).optional().allow(''),
        assignedTo:  Joi.string().hex().length(24).optional().allow(null),
        status:      Joi.string().valid(...Object.values(taskStatusEnum)).optional(),
        priority:    Joi.string().valid(...Object.values(taskPriorityEnum)).optional(),
        deadline:    Joi.date().iso().optional()
    });
    return schema.validate(data, { abortEarly: false });
}

export { Task, taskStatusEnum, taskPriorityEnum, validateTask, validateTaskUpdate };