import mongoose from 'mongoose';
import Joi from 'joi';

const projectStatusEnum = {
    active: 'active',
    archived: 'archived',
    completed: 'completed'
};

const projectSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            trim: true,
            minLength: [2, 'Project name must be at least 2 characters long'],
            maxLength: [100, 'Project name cannot exceed 100 characters']
        },
        description: {
            type: String,
            trim: true,
            maxLength: [500, 'Description cannot exceed 500 characters']
        },
        companyId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Company',
            required: true
        },
        // ✅ NEW — the single team responsible for this project
        teamId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Team',
            default: null
        },
        status: {
            type: String,
            enum: Object.values(projectStatusEnum),
            default: projectStatusEnum.active
        },
        startDate: {
            type: Date
        },
        endDate: {
            type: Date
        },
        isArchived: {
            type: Boolean,
            default: false
        },
        archivedAt: {
            type: Date,
            default: null
        }
    },
    {
        timestamps: true,
        toObject: { virtuals: true },
        toJSON: { virtuals: true }
    }
);

const Project = mongoose.model('Project', projectSchema);

function validateProject(data) {
    const schema = Joi.object({
        name: Joi.string().min(2).max(100).required(),
        description: Joi.string().max(500).optional().allow(''),
        companyId: Joi.string().hex().length(24).required(),
        teamId: Joi.string().hex().length(24).optional().allow(null, ''),
        status: Joi.string()
            .valid(...Object.values(projectStatusEnum))
            .optional(),
        startDate: Joi.date().iso().optional(),
        endDate: Joi.date().iso().min(Joi.ref('startDate')).optional().messages({
            'date.min': 'endDate must be after startDate'
        })
    });

    return schema.validate(data, { abortEarly: false });
}

function validateProjectUpdate(data) {
    const schema = Joi.object({
        name: Joi.string().min(2).max(100).optional(),
        description: Joi.string().max(500).optional().allow(''),
        teamId: Joi.string().hex().length(24).optional().allow(null, ''),
        status: Joi.string()
            .valid(...Object.values(projectStatusEnum))
            .optional(),
        startDate: Joi.date().iso().optional(),
        endDate: Joi.date().iso().optional()
    });

    return schema.validate(data, { abortEarly: false });
}

export { Project, projectStatusEnum, validateProject, validateProjectUpdate };