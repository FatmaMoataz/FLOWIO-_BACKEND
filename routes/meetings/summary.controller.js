import Joi from 'joi';
// إضافة امتداد .js للملفات المحلية إجباري
import { saveSummaryService, getSummaryService } from './summary.service.js';

const isValidObjectId = (id) => /^[0-9a-fA-F]{24}$/.test(id);

// ── Joi validation for incoming AI/manual summary payload ──────────────────────
function validateSummaryPayload(data) {
    const schema = Joi.object({
        // transcript is optional on manual entry, required from AI
        transcript: Joi.string().optional().allow(''),

        // summaryText: accept array of strings OR a single paragraph string
        summaryText: Joi.alternatives()
            .try(
                Joi.array().items(Joi.string()).min(1),
                Joi.string().min(1)
            )
            .required()
            .messages({ 'alternatives.match': 'summaryText must be a string or array of strings' }),

        // tasks array — each item is an action item
        tasks: Joi.array().items(
            Joi.object({
                title:       Joi.string().required(),
                description: Joi.string().optional().allow(''),
                assignedTo:  Joi.string().hex().length(24).optional().allow(null),
                priority:    Joi.string().valid('low', 'medium', 'high').optional(),
                deadline:    Joi.date().iso().optional().allow(null)
            })
        ).optional().default([]),

        // source tells us if this is from the AI model or typed manually
        source: Joi.string().valid('ai', 'manual').optional().default('ai')
    });

    return schema.validate(data, { abortEarly: false });
}

// ── POST /api/meetings/:id/summary ────────────────────────────────────────────
export const saveSummary = async (req, res) => {
    const { id: meetingId } = req.params;

    if (!isValidObjectId(meetingId)) {
        return res.status(400).json({ success: false, message: 'Invalid meetingId in URL.' });
    }

    const { error, value } = validateSummaryPayload(req.body);
    if (error) {
        const messages = error.details.map(d => d.message);
        return res.status(400).json({ success: false, errors: messages });
    }

    try {
        const { log, insertedTasks } = await saveSummaryService(
            meetingId,
            value,
            value.source
        );

        return res.status(200).json({
            success: true,
            message: `Summary saved. ${insertedTasks.length} action item(s) created as tasks.`,
            data: {
                summary:        log,
                insertedTasks:  insertedTasks.map(t => ({ _id: t._id, title: t.title }))
            }
        });
    } catch (err) {
        console.error('[POST /meetings/:id/summary]', err);
        return res.status(500).json({ success: false, message: err.message });
    }
};

// ── GET /api/meetings/:id/summary ─────────────────────────────────────────────
export const getSummary = async (req, res) => {
    const { id: meetingId } = req.params;

    if (!isValidObjectId(meetingId)) {
        return res.status(400).json({ success: false, message: 'Invalid meetingId in URL.' });
    }

    try {
        const log = await getSummaryService(meetingId);

        if (!log) {
            return res.status(404).json({ success: false, message: 'No summary found for this meeting.' });
        }

        // Give frontend a clear status message based on ai_status
        const statusMessages = {
            pending:    'Meeting ended. Waiting for AI to start processing.',
            processing: 'AI is currently processing the meeting audio.',
            completed:  'Summary ready.',
            failed:     `AI processing failed: ${log.ai_error || 'Unknown error'}`
        };

        return res.status(200).json({
            success: true,
            status:  log.ai_status,
            message: statusMessages[log.ai_status],
            data:    log
        });
    } catch (err) {
        console.error('[GET /meetings/:id/summary]', err);
        return res.status(500).json({ success: false, message: err.message });
    }
};