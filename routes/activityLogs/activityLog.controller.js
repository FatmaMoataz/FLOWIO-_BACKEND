const activityLogService = require('./activityLog.service');

// ── Helper ─────────────────────────────────────────────────────────────────────
const isValidObjectId = (id) => /^[0-9a-fA-F]{24}$/.test(id);

// ── Get Logs for an Entity ─────────────────────────────────────────────────────
// e.g. GET /api/activity/task/:entity_id  → all logs for a specific task

const getLogsByEntity = async (req, res) => {
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
// e.g. GET /api/activity/user/:userId → all actions performed by a user

const getLogsByUser = async (req, res) => {
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

module.exports = { getLogsByEntity, getLogsByUser };