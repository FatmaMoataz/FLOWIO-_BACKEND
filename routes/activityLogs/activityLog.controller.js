import * as activityLogService from './activityLog.service.js';

// ── Helper ─────────────────────────────────────────────────────────────────────
const isValidObjectId = (id) => /^[0-9a-fA-F]{24}$/.test(id);

// ── Get Logs for an Entity ─────────────────────────────────────────────────────
export const getLogsByEntity = async (req, res) => {
    const { entity_type, entity_id } = req.params;

    if (!isValidObjectId(entity_id)) {
        return res.status(400).json({ success: false, message: 'Invalid entity_id in URL.' });
    }

    try {
        const logs = await activityLogService.getLogsByEntityService(entity_type, entity_id);
        return res.status(200).json({ success: true, data: logs });
    } catch (err) {
        console.error('[getLogsByEntity]', err);
        return res.status(500).json({ success: false, message: err.message });
    }
};

// ── Get Logs by User ───────────────────────────────────────────────────────────
export const getLogsByUser = async (req, res) => {
    const { userId } = req.params;

    if (!isValidObjectId(userId)) {
        return res.status(400).json({ success: false, message: 'Invalid userId in URL.' });
    }

    try {
        const logs = await activityLogService.getLogsByUserService(userId);
        return res.status(200).json({ success: true, data: logs });
    } catch (err) {
        console.error('[getLogsByUser]', err);
        return res.status(500).json({ success: false, message: err.message });
    }
};