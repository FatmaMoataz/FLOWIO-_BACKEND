const mongoose = require('mongoose');
const Joi = require('joi');

const projectRoleEnum = {
    projectManager: 'project-manager',
    teamMember: 'team-member',
    viewer: 'viewer'
};

const projectMemberSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true
        },
        projectId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Project',
            required: true
        },
        role_in_project: {
            type: String,
            enum: Object.values(projectRoleEnum),
            default: projectRoleEnum.teamMember
        },
        joined_at: {
            type: Date,
            default: Date.now
        }
    },
    {
        timestamps: true
    }
);

// Prevent the same user from being added to the same project twice
projectMemberSchema.index({ userId: 1, projectId: 1 }, { unique: true });

const ProjectMember = mongoose.model('ProjectMember', projectMemberSchema);

// ── Joi Validation ─────────────────────────────────────────────────────────────

function validateProjectMember(data) {
    const schema = Joi.object({
        userId: Joi.string().hex().length(24).required().messages({
            'string.hex': 'userId must be a valid ObjectId',
            'any.required': 'userId is required'
        }),
        role_in_project: Joi.string()
            .valid(...Object.values(projectRoleEnum))
            .optional()
    });

    return schema.validate(data, { abortEarly: false });
}

function validateProjectMemberUpdate(data) {
    const schema = Joi.object({
        role_in_project: Joi.string()
            .valid(...Object.values(projectRoleEnum))
            .required()
            .messages({
                'any.required': 'role_in_project is required for update',
                'any.only': `role_in_project must be one of: ${Object.values(projectRoleEnum).join(', ')}`
            })
    });

    return schema.validate(data, { abortEarly: false });
}

module.exports = { ProjectMember, projectRoleEnum, validateProjectMember, validateProjectMemberUpdate };