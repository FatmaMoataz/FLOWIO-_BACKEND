import { v4 as uuidv4 } from 'uuid';
import { Meeting, meetingStatusEnum } from '../../models/meeting.model.js';
import { MeetingLog } from '../../models/meetingLog.model.js';

// ── Shared populate ────────────────────────────────────────────────────────────
const MEETING_POPULATE = [
    { path: 'createdBy', select: 'name email' },
    { path: 'attendees', select: 'name email' },
    { path: 'projectId', select: 'name status' }
];

// ── Create Meeting ─────────────────────────────────────────────────────────────
export const createMeetingService = async (data) => {
    const roomId = uuidv4(); // unique room ID for WebRTC
    const meeting_link = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/meeting/${roomId}`;

    const meeting = await Meeting.create({ ...data, roomId, meeting_link });

    // Create an empty MeetingLog immediately so AI can update it later
    await MeetingLog.create({ meetingId: meeting._id });

    return await meeting.populate(MEETING_POPULATE);
};

// ── Get All Meetings for a Project ─────────────────────────────────────────────
export const getMeetingsByProjectService = async (projectId) => {
    return await Meeting.find({ projectId })
        .populate(MEETING_POPULATE)
        .sort({ createdAt: -1 });
};

// ── Get Single Meeting ─────────────────────────────────────────────────────────
export const getMeetingByIdService = async (id) => {
    return await Meeting.findById(id).populate(MEETING_POPULATE);
};

// ── Start Meeting ──────────────────────────────────────────────────────────────
export const startMeetingService = async (id) => {
    return await Meeting.findByIdAndUpdate(
        id,
        { status: meetingStatusEnum.live, startedAt: new Date() },
        { new: true }
    ).populate(MEETING_POPULATE);
};

// ── End Meeting ────────────────────────────────────────────────────────────────
export const endMeetingService = async (id) => {
    const meeting = await Meeting.findById(id);
    if (!meeting) return null;

    const endedAt  = new Date();
    const duration = meeting.startedAt
        ? Math.round((endedAt - meeting.startedAt) / 60000) // ms → minutes
        : 0;

    const updated = await Meeting.findByIdAndUpdate(
        id,
        { status: meetingStatusEnum.ended, endedAt, duration },
        { new: true }
    ).populate(MEETING_POPULATE);

    // Mark the log as ready for AI processing
    await MeetingLog.findOneAndUpdate(
        { meetingId: id },
        { ai_status: 'pending' }
    );

    return updated;
};

// ── Update Meeting ─────────────────────────────────────────────────────────────
export const updateMeetingService = async (id, data) => {
    return await Meeting.findByIdAndUpdate(id, data, { new: true, runValidators: true })
        .populate(MEETING_POPULATE);
};

// ── Delete Meeting ─────────────────────────────────────────────────────────────
export const deleteMeetingService = async (id) => {
    await MeetingLog.findOneAndDelete({ meetingId: id });
    return await Meeting.findByIdAndDelete(id);
};

// ── Get Meeting Log ────────────────────────────────────────────────────────────
export const getMeetingLogService = async (meetingId) => {
    return await MeetingLog.findOne({ meetingId })
        .populate('extracted_tasks.assignedTo', 'name email')
        .populate('extracted_tasks.taskId', 'title status');
};

// Default export for convenience
export default {
    createMeetingService,
    getMeetingsByProjectService,
    getMeetingByIdService,
    startMeetingService,
    endMeetingService,
    updateMeetingService,
    deleteMeetingService,
    getMeetingLogService
};