import { ActivityLog } from '../../models/activityLog.model.js';

// ── Log an activity (called from other controllers) ───────────────────────────
/**
 * Usage in any controller:
 *   import { logActivity } from '../activityLogs/activityLog.service.js';
 *
 *   await logActivity({
 *     userId:      targetUserId,       // who RECEIVES the activity
 *     performedBy: req.user._id,       // who DID the action
 *     type:        'invitation',
 *     title:       'John Sent You an Invitation To Join Meeting',
 *     description: 'You have a new invitation to join the Flowio meeting',
 *     targetId:    invitation._id,
 *     targetType:  'Invitation',
 *     actionType:  'accept'
 *   });
 */
const logActivity = async ({
    userId,
    performedBy = null,
    type        = 'general',
    title,
    description = '',
    targetId    = null,
    targetType  = null,
    actionType  = 'none'
}) => {
    try {
        await ActivityLog.create({
            userId,
            performedBy,
            type,
            title,
            description,
            targetId,
            targetType,
            actionType,
            isRead: false
        });
    } catch (err) {
        // Never crash the main operation — log silently
        console.error('[logActivity] Failed to write activity log:', err.message);
    }
};

// ── Get recent activities for a user ──────────────────────────────────────────

const getRecentActivitiesService = async (userId, limit = 20, page = 1) => {
    const skip = (page - 1) * limit;

    const [activities, totalCount, unreadCount] = await Promise.all([
        ActivityLog.find({ userId })
            .populate('performedBy', 'name email')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit),

        ActivityLog.countDocuments({ userId }),
        ActivityLog.countDocuments({ userId, isRead: false })
    ]);

    return { activities, totalCount, unreadCount };
};

// ── Mark single activity as read ───────────────────────────────────────────────

const markAsReadService = async (activityId, userId) => {
    return await ActivityLog.findOneAndUpdate(
        { _id: activityId, userId }, // userId check prevents reading others' activities
        { isRead: true, readAt: new Date() },
        { new: true }
    );
};

// ── Mark all activities as read ────────────────────────────────────────────────

const markAllAsReadService = async (userId) => {
    const result = await ActivityLog.updateMany(
        { userId, isRead: false },
        { isRead: true, readAt: new Date() }
    );
    return result.modifiedCount;
};

// ── Mark specific activities as read (bulk by IDs) ─────────────────────────────

const markManyAsReadService = async (activityIds, userId) => {
    const result = await ActivityLog.updateMany(
        { _id: { $in: activityIds }, userId },
        { isRead: true, readAt: new Date() }
    );
    return result.modifiedCount;
};

export {
    logActivity,
    getRecentActivitiesService,
    markAsReadService,
    markAllAsReadService,
    markManyAsReadService
};