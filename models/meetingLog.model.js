import mongoose from 'mongoose';

/**
 * MeetingLog — stores everything the AI generates after a meeting ends.
 *
 * Compatible with your partner's AI model output.
 * Expected AI output shape:
 * {
 *   transcript:   "Full meeting text...",
 *   summaryText:  ["Point 1", "Point 2", "Point 3"],
 *   tasks: [
 *     { title, description, assignedTo, priority, deadline }
 *   ]
 * }
 */

const extractedTaskSchema = new mongoose.Schema(
    {
        title:       { type: String, required: true },
        description: { type: String },
        assignedTo:  { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
        priority:    { type: String, enum: ['low', 'medium', 'high'], default: 'medium' },
        deadline:    { type: Date },
        inserted:    { type: Boolean, default: false },
        taskId:      { type: mongoose.Schema.Types.ObjectId, ref: 'Task', default: null }
    },
    { _id: true }
);

const meetingLogSchema = new mongoose.Schema(
    {
        meetingId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Meeting',
            required: true,
            unique: true
        },

        // ── Transcript ─────────────────────────────────────────────────────────
        transcript: {
            type: String,
            default: ''
        },

        // ── Summary ────────────────────────────────────────────────────────────
        // Array of bullet point strings  e.g. ["Sara will fix bug", "Mike reviews schema"]
        summaryText: {
            type: [String],
            default: []
        },
        // Flat paragraph version — auto-joined from summaryText if not provided
        summaryParagraph: {
            type: String,
            default: ''
        },

        // ── Extracted Action Items ─────────────────────────────────────────────
        extracted_tasks: [extractedTaskSchema],

        // ── AI Processing Status ───────────────────────────────────────────────
        ai_status: {
            type: String,
            enum: ['pending', 'processing', 'completed', 'failed'],
            default: 'pending'
        },
        ai_error:     { type: String,  default: null },
        processed_at: { type: Date },

        // ai = partner's model output | manual = typed in by a user
        source: {
            type: String,
            enum: ['ai', 'manual'],
            default: 'ai'
        }
    },
    { timestamps: true }
);

const MeetingLog = mongoose.model('MeetingLog', meetingLogSchema);

export { MeetingLog };