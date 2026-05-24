// إضافة امتداد .js للموديل المحلي إجباري
import { ActivityLog } from '../../models/activityLog.model.js';

// ── Shared populate config ─────────────────────────────────────────────────────
const LOG_POPULATE = [
    { path: 'performed_by', select: 'name email' }
];

// ── Create log entry ───────────────────────────────────────────────────────────
export const createLogService = async (data) => {
    return await ActivityLog.create(data);
};

// ── Get logs for a specific entity ────────────────────────────────────────────
export const getLogsByEntityService = async (entity_type, entity_id) => {
    return await ActivityLog.find({ entity_type, entity_id })
        .populate(LOG_POPULATE)
        .sort({ createdAt: -1 });
};

// ── Get logs by user ───────────────────────────────────────────────────────────
export const getLogsByUserService = async (userId) => {
    return await ActivityLog.find({ performed_by: userId })
        .populate(LOG_POPULATE)
        .sort({ createdAt: -1 })
        .limit(50); // cap at 50 most recent
};

// ── Helper: call this from ANY other controller to log an action ───────────────
export const logActivity = async (performed_by, entity_type, entity_id, action, description, metadata = {}) => {
    try {
        await ActivityLog.create({ performed_by, entity_type, entity_id, action, description, metadata });
    } catch (err) {
        // Logging should never crash the main operation — fail silently
        console.error('[logActivity] Failed to write activity log:', err.message);
    }
};