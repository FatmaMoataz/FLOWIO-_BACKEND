import mongoose from 'mongoose';
import Joi from 'joi';

const teamRoleEnum = {
    lead: 'lead',
    member: 'member'
};

const teamMemberSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true
        },
        teamId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Team',
            required: true
        },
        role_in_team: {
            type: String,
            enum: Object.values(teamRoleEnum),
            default: teamRoleEnum.member
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

// Prevent the same user from being added to the same team twice
teamMemberSchema.index({ userId: 1, teamId: 1 }, { unique: true });

const TeamMember = mongoose.model('TeamMember', teamMemberSchema);

// ── Joi Validation ─────────────────────────────────────────────────────────────

function validateTeamMember(data) {
    const schema = Joi.object({
        userId: Joi.string().hex().length(24).required().messages({
            'any.required': 'userId is required',
            'string.hex': 'userId must be a valid ObjectId'
        }),
        role_in_team: Joi.string()
            .valid(...Object.values(teamRoleEnum))
            .optional()
    });

    return schema.validate(data, { abortEarly: false });
}

function validateTeamMemberUpdate(data) {
    const schema = Joi.object({
        role_in_team: Joi.string()
            .valid(...Object.values(teamRoleEnum))
            .required()
            .messages({
                'any.required': 'role_in_team is required for update',
                'any.only': `role_in_team must be one of: ${Object.values(teamRoleEnum).join(', ')}`
            })
    });

    return schema.validate(data, { abortEarly: false });
}

export { TeamMember, teamRoleEnum, validateTeamMember, validateTeamMemberUpdate };