const mongoose = require('mongoose');
const Joi = require('joi');

const allowedMimeTypes = [
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'text/plain',
    'application/zip'
];

const fileAttachmentSchema = new mongoose.Schema(
    {
        file_path: {
            type: String,
            required: true,
            trim: true
        },
        original_name: {
            type: String,
            required: true,
            trim: true
        },
        mime_type: {
            type: String,
            required: true
        },
        size_bytes: {
            type: Number,
            required: true
        },
        // What this file is attached to — task, project, etc.
        entity_type: {
            type: String,
            enum: ['task', 'project', 'epic', 'meeting'],
            required: true
        },
        entity_id: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
            refPath: 'entity_type' // dynamic ref based on entity_type
        },
        uploaded_by: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true
        }
    },
    {
        timestamps: true
    }
);

const FileAttachment = mongoose.model('FileAttachment', fileAttachmentSchema);

// ── Joi Validation ─────────────────────────────────────────────────────────────

function validateFileAttachment(data) {
    const schema = Joi.object({
        entity_type: Joi.string()
            .valid('task', 'project', 'epic', 'meeting')
            .required()
            .messages({ 'any.required': 'entity_type is required' }),
        entity_id: Joi.string().hex().length(24).required().messages({
            'any.required': 'entity_id is required',
            'string.hex': 'entity_id must be a valid ObjectId'
        })
    });

    return schema.validate(data, { abortEarly: false });
}

module.exports = { FileAttachment, allowedMimeTypes, validateFileAttachment };