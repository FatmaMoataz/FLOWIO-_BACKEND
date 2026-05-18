const { ActivityLog } = require('../../models/activityLog.model');

// ── Shared populate config ─────────────────────────────────────────────────────
const LOG_POPULATE = [
    { path: 'performed_by', select: 'name email' }
];

// ── Create log entry ───────────────────────────────────────────────────────────

const createLogService = async (data) => {
    return await ActivityLog.create(data);
};

// ── Get logs for a specific entity ────────────────────────────────────────────

const getLogsByEntityService = async (entity_type, entity_id) => {
    return await ActivityLog.find({ entity_type, entity_id })
        .populate(LOG_POPULATE)
        .sort({ createdAt: -1 });
};

// ── Get logs by user ───────────────────────────────────────────────────────────

const getLogsByUserService = async (userId) => {
    return await ActivityLog.find({ performed_by: userId })
        .populate(LOG_POPULATE)
        .sort({ createdAt: -1 })
        .limit(50); // cap at 50 most recent
};

// ── Helper: call this from ANY other controller to log an action ───────────────
// Usage example inside task controller after updating a task:
//   await logActivity(req.user._id, 'task', task._id, 'updated', `${req.user.name} updated task '${task.title}'`);

const logActivity = async (performed_by, entity_type, entity_id, action, description, metadata = {}) => {
    try {
        await ActivityLog.create({ performed_by, entity_type, entity_id, action, description, metadata });
    } catch (err) {
        // Logging should never crash the main operation — fail silently
        console.error('[logActivity] Failed to write activity log:', err.message);
    }
};

module.exports = {
    createLogService,
    getLogsByEntityService,
    getLogsByUserService,
    logActivity // ← import this in other controllers
};