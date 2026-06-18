import mongoose from 'mongoose';

/**
 * ActivityLog Model — powers the "Recent Activity" dashboard screen
 *
 * Each document represents one activity item shown in the UI:
 *   - "John Sent You an Invitation To Join Meeting" → type: 'invitation'
 *   - "Meeting With Sarah — summary is ready"       → type: 'meeting_summary'
 *   - "Task Completed"                              → type: 'task'
 */

const activityLogSchema = new mongoose.Schema(
    {
        // Who RECEIVES this notification (shown in their activity feed)
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true
        },

        // Who PERFORMED the action (e.g. "John" in "John sent you an invitation")
        performedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            default: null
        },

        // Activity type — drives icon color and action button in UI
        type: {
            type: String,
            enum: [
                'invitation',       // red icon  → "Accept" button
                'meeting_summary',  // yellow icon → "Summary" button
                'task',             // grey icon  → "Details" button
                'project',
                'mention',
                'general'
            ],
            required: true
        },

        // Display title — e.g. "John Sent You an Invitation To Join Meeting"
        title: {
            type: String,
            required: true,
            trim: true,
            maxLength: 200
        },

        // Subtitle/description — e.g. "You have a new invitation to join the Flowio meeting"
        description: {
            type: String,
            trim: true,
            maxLength: 500,
            default: ''
        },

        // The entity this activity refers to (meetingId, taskId, invitationId, etc.)
        targetId: {
            type: mongoose.Schema.Types.ObjectId,
            default: null
        },

        // What collection targetId refers to — so frontend knows where to navigate
        targetType: {
            type: String,
            enum: ['Meeting', 'Task', 'Invitation', 'Project', 'Epic', null],
            default: null
        },

        // The action the user can take from the activity item
        // Maps to the button shown in the UI
        actionType: {
            type: String,
            enum: ['accept', 'view_summary', 'view_details', 'none'],
            default: 'none'
        },

        // false = shows "NEW" badge in UI, true = badge hidden
        isRead: {
            type: Boolean,
            default: false
        },

        readAt: {
            type: Date,
            default: null
        }
    },
    {
        timestamps: true // createdAt used for "2 min ago" relative time
    }
);

// Index for fast per-user queries sorted by newest first
activityLogSchema.index({ userId: 1, createdAt: -1 });
// Index for unread count queries
activityLogSchema.index({ userId: 1, isRead: 1 });

const ActivityLog = mongoose.model('ActivityLog', activityLogSchema);

export { ActivityLog };