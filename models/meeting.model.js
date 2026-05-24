import mongoose from 'mongoose';
import Joi from 'joi';

const meetingStatusEnum = {
    scheduled: 'scheduled',
    live:      'live',
    ended:     'ended'
};

const meetingSchema = new mongoose.Schema(
    {
        title: {
            type: String,
            required: true,
            trim: true,
            minLength: [2, 'Title must be at least 2 characters'],
            maxLength: [100, 'Title cannot exceed 100 characters']
        },
        description: {
            type: String,
            trim: true,
            maxLength: [500, 'Description cannot exceed 500 characters']
        },
        projectId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Project',
            required: true
        },
        createdBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true
        },
        attendees: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'User'
            }
        ],
        status: {
            type: String,
            enum: Object.values(meetingStatusEnum),
            default: meetingStatusEnum.scheduled
        },
        // Unique room ID used by WebRTC/Socket.io to identify the meeting room
        roomId: {
            type: String,
            unique: true,
            required: true
        },
        meeting_link: {
            type: String,
            trim: true
        },
        startedAt: {
            type: Date
        },
        endedAt: {
            type: Date
        },
        // Duration in minutes — calculated when meeting ends
        duration: {
            type: Number,
            default: 0
        }
    },
    {
        timestamps: true
    }
);

const Meeting = mongoose.model('Meeting', meetingSchema);

// ── Joi Validation ─────────────────────────────────────────────────────────────

function validateMeeting(data) {
    const schema = Joi.object({
        title: Joi.string().min(2).max(100).required(),
        description: Joi.string().max(500).optional().allow(''),
        projectId: Joi.string().hex().length(24).required().messages({
            'any.required': 'projectId is required'
        }),
        attendees: Joi.array()
            .items(Joi.string().hex().length(24))
            .optional()
    });

    return schema.validate(data, { abortEarly: false });
}

function validateMeetingUpdate(data) {
    const schema = Joi.object({
        title:       Joi.string().min(2).max(100).optional(),
        description: Joi.string().max(500).optional().allow(''),
        attendees:   Joi.array().items(Joi.string().hex().length(24)).optional(),
        status:      Joi.string().valid(...Object.values(meetingStatusEnum)).optional()
    });

    return schema.validate(data, { abortEarly: false });
}

export { Meeting, meetingStatusEnum, validateMeeting, validateMeetingUpdate };

module.exports = { Meeting, meetingStatusEnum, validateMeeting, validateMeetingUpdate };