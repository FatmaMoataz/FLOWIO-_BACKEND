// إضافة امتداد .js للموديلات المحلية إجباري
import { MeetingLog } from '../../models/meetingLog.model.js';
import { Task }       from '../../models/task.model.js';
import { Meeting }    from '../../models/meeting.model.js';

// ── Shared populate ────────────────────────────────────────────────────────────
const LOG_POPULATE = [
    { path: 'extracted_tasks.assignedTo', select: 'name email' },
    { path: 'extracted_tasks.taskId',     select: 'title status' },
    { path: 'meetingId',                  select: 'title projectId status duration' }
];

// ── Save Summary (POST) ────────────────────────────────────────────────────────
export const saveSummaryService = async (meetingId, payload, source = 'ai') => {
    const { transcript, summaryText, tasks = [] } = payload;

    // Normalize summaryText — accept both array and plain string
    let summaryArray     = [];
    let summaryParagraph = '';

    if (Array.isArray(summaryText)) {
        summaryArray     = summaryText;
        summaryParagraph = summaryText.join(' ');
    } else if (typeof summaryText === 'string') {
        summaryParagraph = summaryText;
        // Split on newlines or periods to make bullet points
        summaryArray = summaryText
            .split(/\n|(?<=\.)\s+/)
            .map(s => s.trim())
            .filter(Boolean);
    }

    // Save to MeetingLog
    const log = await MeetingLog.findOneAndUpdate(
        { meetingId },
        {
            transcript,
            summaryText:      summaryArray,
            summaryParagraph,
            ai_status:        'completed',
            processed_at:     new Date(),
            source
        },
        { new: true, upsert: true } // create if doesn't exist yet
    );

    // Auto-insert extracted tasks into Tasks collection
    const insertedTasks = await insertActionItems(meetingId, tasks);

    return { log, insertedTasks };
};

// ── Fetch Summary (GET) ────────────────────────────────────────────────────────
export const getSummaryService = async (meetingId) => {
    return await MeetingLog.findOne({ meetingId })
        .populate(LOG_POPULATE);
};

// ── Insert Action Items into Tasks collection ──────────────────────────────────
export const insertActionItems = async (meetingId, tasks = []) => {
    if (!tasks.length) return [];

    const meeting = await Meeting.findById(meetingId);
    if (!meeting) throw new Error('Meeting not found when inserting action items.');

    const insertedTasks    = [];
    const updatedExtracted = [];

    for (const item of tasks) {
        try {
            const task = await Task.create({
                title:       item.title,
                description: item.description || `Action item from meeting: ${meeting.title}`,
                projectId:   meeting.projectId,
                assignedTo:  item.assignedTo  || null,
                priority:    item.priority    || 'medium',
                deadline:    item.deadline    || null,
                status:      'todo'
            });

            insertedTasks.push(task);
            updatedExtracted.push({
                title:       item.title,
                description: item.description,
                assignedTo:  item.assignedTo,
                priority:    item.priority,
                deadline:    item.deadline,
                inserted:    true,
                taskId:      task._id
            });
        } catch (err) {
            console.error('[insertActionItems] Failed to insert task:', item.title, err.message);
            updatedExtracted.push({ ...item, inserted: false });
        }
    }

    // Update MeetingLog with taskId references
    await MeetingLog.findOneAndUpdate(
        { meetingId },
        { extracted_tasks: updatedExtracted }
    );

    return insertedTasks;
};

// عمل export default ككائن موحد لزيادة المرونة عند الاستدعاء في الـ Controller
export default {
    saveSummaryService,
    getSummaryService,
    insertActionItems
};