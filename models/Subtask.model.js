import mongoose from 'mongoose';
import Joi from 'joi';

const subtaskStatusEnum = {
    todo: 'To Do',
    inProgress: 'In Progress',
    done: 'Done'
};

const subtaskSchema = new mongoose.Schema(
    {
        title: {
            type: String,
            required: true,
            trim: true,
            minLength: [1, 'Subtask title cannot be empty'],
            maxLength: [200, 'Subtask title cannot exceed 200 characters']
        },
        description: {
            type: String,
            trim: true,
            maxLength: [1000, 'Description cannot exceed 1000 characters']
        },
        status: {
            type: String,
            enum: Object.values(subtaskStatusEnum),
            default: subtaskStatusEnum.todo
        },
        // ── ربط الـ Subtask بالـ Task الأب ───────────────────────────────────
        taskId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Task',
            required: true
        },
        companyId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Company',
            required: true
        },
        assignee: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            default: null
        },
        due_date: {
            type: Date,
            default: null
        },
        isCompleted: {
            type: Boolean,
            default: false
        }
    },
    {
        timestamps: true,
        toObject: { virtuals: true },
        toJSON: { virtuals: true }
    }
);

const Subtask = mongoose.model('Subtask', subtaskSchema);

// ── Joi Validation ─────────────────────────────────────────────────────────────

function validateSubtask(data) {
    const schema = Joi.object({
        title: Joi.string().min(1).max(200).required().messages({
            'string.empty': 'Subtask title cannot be empty.',
            'any.required': 'Subtask title is required.'
        }),
        description: Joi.string().max(1000).optional().allow(''),
        status: Joi.string()
            .valid(...Object.values(subtaskStatusEnum))
            .optional(),
        taskId: Joi.string().hex().length(24).required().messages({
            'string.hex': 'taskId must be a valid MongoDB ObjectId.',
            'any.required': 'taskId is required.'
        }),
        companyId: Joi.string().hex().length(24).required().messages({
            'string.hex': 'companyId must be a valid MongoDB ObjectId.',
            'any.required': 'companyId is required.'
        }),
        assignee: Joi.string().hex().length(24).optional().allow(null),
        due_date: Joi.date().iso().optional(),
        isCompleted: Joi.boolean().optional()
    });

    return schema.validate(data, { abortEarly: false });
}

function validateSubtaskUpdate(data) {
    const schema = Joi.object({
        title: Joi.string().min(1).max(200).optional(),
        description: Joi.string().max(1000).optional().allow(''),
        status: Joi.string()
            .valid(...Object.values(subtaskStatusEnum))
            .optional(),
        assignee: Joi.string().hex().length(24).optional().allow(null),
        due_date: Joi.date().iso().optional().allow(null),
        isCompleted: Joi.boolean().optional()
    });

    return schema.validate(data, { abortEarly: false });
}

export { Subtask, subtaskStatusEnum, validateSubtask, validateSubtaskUpdate };