import mongoose from 'mongoose';
import Joi from 'joi';

const activityActionEnum = {
    created:    'created',
    updated:    'updated',
    deleted:    'deleted',
    uploaded:   'uploaded',
    assigned:   'assigned',
    moved:      'moved',
    commented:  'commented',
    joined:     'joined',
    left:       'left'
};

const activityEntityEnum = {
    task:       'task',
    project:    'project',
    epic:       'epic',
    team:       'team',
    company:    'company',
    file:       'file',
    meeting:    'meeting',
    invitation: 'invitation'
};

const activityLogSchema = new mongoose.Schema(
    {
        // Who performed the action
        performed_by: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true
        },
        // What type of entity was affected
        entity_type: {
            type: String,
            enum: Object.values(activityEntityEnum),
            required: true
        },
        // The ID of the affected entity
        entity_id: {
            type: mongoose.Schema.Types.ObjectId,
            required: true
        },
        // What action was performed
        action: {
            type: String,
            enum: Object.values(activityActionEnum),
            required: true
        },
        // Human-readable description e.g. "John moved task 'Fix bug' to Done"
        description: {
            type: String,
            required: true,
            trim: true,
            maxLength: 500
        },
        // Optional: store before/after snapshot for auditing
        metadata: {
            type: mongoose.Schema.Types.Mixed,
            default: {}
        }
    },
    {
        timestamps: true
    }
);

// Index for fast querying by entity (e.g. "all logs for task X")
activityLogSchema.index({ entity_type: 1, entity_id: 1 });
// Index for fast querying by user (e.g. "all actions by user Y")
activityLogSchema.index({ performed_by: 1 });

const ActivityLog = mongoose.model('ActivityLog', activityLogSchema);

// ── Joi Validation ─────────────────────────────────────────────────────────────

function validateActivityLog(data) {
    const schema = Joi.object({
        entity_type: Joi.string()
            .valid(...Object.values(activityEntityEnum))
            .required(),
        entity_id: Joi.string().hex().length(24).required(),
        action: Joi.string()
            .valid(...Object.values(activityActionEnum))
            .required(),
        description: Joi.string().max(500).required(),
        metadata: Joi.object().optional()
    });

    return schema.validate(data, { abortEarly: false });
}

export { ActivityLog, activityActionEnum, activityEntityEnum, validateActivityLog };