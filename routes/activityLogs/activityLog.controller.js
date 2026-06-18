import {
    getRecentActivitiesService,
    markAsReadService,
    markAllAsReadService,
    markManyAsReadService
} from './activityLog.service.js';

const isValidObjectId = (id) => /^[0-9a-fA-F]{24}$/.test(id);

// ── GET /api/activities ────────────────────────────────────────────────────────
/**
 * Returns the full activity feed for the logged-in user.
 * Response shape matches exactly what the UI needs:
 * {
 *   stats: { total: 6, unread: 3 },
 *   activities: [
 *     {
 *       _id, type, title, description,
 *       isRead, actionType, targetId, targetType,
 *       performedBy: { name, email },
 *       createdAt,
 *       timeAgo: "2 min ago"
 *     }
 *   ]
 * }
 */
export const getRecentActivities = async (req, res) => {
    const limit = parseInt(req.query.limit) || 20;
    const page  = parseInt(req.query.page)  || 1;

    try {
        const { activities, totalCount, unreadCount } =
            await getRecentActivitiesService(req.user._id, limit, page);

        // Add relative time string for each activity (e.g. "2 min ago")
        const mapped = activities.map(activity => ({
            _id:         activity._id,
            type:        activity.type,
            title:       activity.title,
            description: activity.description,
            isRead:      activity.isRead,
            actionType:  activity.actionType,   // 'accept' | 'view_summary' | 'view_details' | 'none'
            targetId:    activity.targetId,
            targetType:  activity.targetType,
            performedBy: activity.performedBy,
            createdAt:   activity.createdAt,
            timeAgo:     getTimeAgo(activity.createdAt)
        }));

        return res.status(200).json({
            success: true,
            stats: {
                total:  totalCount,
                unread: unreadCount   // shown as "New" counter in UI
            },
            pagination: {
                page,
                limit,
                totalPages: Math.ceil(totalCount / limit)
            },
            data: mapped
        });
    } catch (err) {
        console.error('[getRecentActivities]', err);
        return res.status(500).json({ success: false, message: err.message });
    }
};

// ── PATCH /api/activities/:id/read ─────────────────────────────────────────────
// Marks a single activity as read — clears the "NEW" badge

export const markAsRead = async (req, res) => {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
        return res.status(400).json({ success: false, message: 'Invalid activity ID.' });
    }

    try {
        const activity = await markAsReadService(id, req.user._id);

        if (!activity) {
            return res.status(404).json({ success: false, message: 'Activity not found.' });
        }

        return res.status(200).json({ success: true, data: activity });
    } catch (err) {
        console.error('[markAsRead]', err);
        return res.status(500).json({ success: false, message: err.message });
    }
};

// ── POST /api/activities/read-all ──────────────────────────────────────────────
// Marks ALL unread activities as read — clears all "NEW" badges at once

export const markAllAsRead = async (req, res) => {
    try {
        const count = await markAllAsReadService(req.user._id);

        return res.status(200).json({
            success: true,
            message: `${count} activity/activities marked as read.`
        });
    } catch (err) {
        console.error('[markAllAsRead]', err);
        return res.status(500).json({ success: false, message: err.message });
    }
};

// ── POST /api/activities/read-many ─────────────────────────────────────────────
// Marks specific activities as read (bulk select in UI)
// Body: { "ids": ["id1", "id2", "id3"] }

export const markManyAsRead = async (req, res) => {
    const { ids } = req.body;

    if (!Array.isArray(ids) || ids.length === 0) {
        return res.status(400).json({ success: false, message: 'ids must be a non-empty array.' });
    }

    const invalidIds = ids.filter(id => !isValidObjectId(id));
    if (invalidIds.length > 0) {
        return res.status(400).json({
            success: false,
            message: `Invalid IDs: ${invalidIds.join(', ')}`
        });
    }

    try {
        const count = await markManyAsReadService(ids, req.user._id);
        return res.status(200).json({
            success: true,
            message: `${count} activity/activities marked as read.`
        });
    } catch (err) {
        console.error('[markManyAsRead]', err);
        return res.status(500).json({ success: false, message: err.message });
    }
};

// ── Helper: relative time string ───────────────────────────────────────────────

const getTimeAgo = (date) => {
    const seconds = Math.floor((new Date() - new Date(date)) / 1000);

    if (seconds < 60)                        return `${seconds}s ago`;
    if (seconds < 3600)                      return `${Math.floor(seconds / 60)} min ago`;
    if (seconds < 86400)                     return `${Math.floor(seconds / 3600)} hr ago`;
    if (seconds < 604800)                    return `${Math.floor(seconds / 86400)} days ago`;
    return new Date(date).toLocaleDateString();
};