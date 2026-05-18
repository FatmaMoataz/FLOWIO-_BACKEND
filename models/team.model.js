const mongoose = require('mongoose');
const Joi = require('joi');

const teamSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            trim: true,
            minLength: [2, 'Team name must be at least 2 characters long'],
            maxLength: [100, 'Team name cannot exceed 100 characters']
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
        createdBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true
        }
    },
    {
        timestamps: true
    }
);

const Team = mongoose.model('Team', teamSchema);

// ── Joi Validation ─────────────────────────────────────────────────────────────

function validateTeam(data) {
    const schema = Joi.object({
        name: Joi.string().min(2).max(100).required(),
        description: Joi.string().max(500).optional().allow(''),
        companyId: Joi.string().hex().length(24).required().messages({
            'any.required': 'companyId is required',
            'string.hex': 'companyId must be a valid ObjectId'
        })
    });

    return schema.validate(data, { abortEarly: false });
}

function validateTeamUpdate(data) {
    const schema = Joi.object({
        name: Joi.string().min(2).max(100).optional(),
        description: Joi.string().max(500).optional().allow('')
    });

    return schema.validate(data, { abortEarly: false });
}

module.exports = { Team, validateTeam, validateTeamUpdate };