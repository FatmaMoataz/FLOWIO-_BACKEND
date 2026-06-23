import * as meetingService from './meeting.service.js';
import * as aiService from './aiIntegration.service.js';
import { validateMeeting, validateMeetingUpdate } from '../../models/meeting.model.js';
import { logActivity } from '../activityLogs/activityLog.service.js';

const isValidObjectId = (id) => /^[0-9a-fA-F]{24}$/.test(id);

// ── Get All Meetings for a Project ─────────────────────────────────────────────
export const getMeetingsByProject = async (req, res) => {
    const { projectId } = req.params;

    if (!isValidObjectId(projectId)) {
        return res.status(400).json({ success: false, message: 'Invalid projectId in URL.' });
    }

    try {
        const meetings = await meetingService.getMeetingsByProjectService(projectId);
        return res.status(200).json({ success: true, data: meetings });
    } catch (err) {
        console.error('[getMeetingsByProject]', err);
        return res.status(500).json({ success: false, message: err.message });
    }
};

// ── Get Single Meeting ─────────────────────────────────────────────────────────
export const getMeetingById = async (req, res) => {
    try {
        const meeting = await meetingService.getMeetingByIdService(req.params.id);
        if (!meeting) {
            return res.status(404).json({ success: false, message: 'Meeting not found.' });
        }
        return res.status(200).json({ success: true, data: meeting });
    } catch (err) {
        console.error('[getMeetingById]', err);
        return res.status(500).json({ success: false, message: err.message });
    }
};

// ── Create Meeting ─────────────────────────────────────────────────────────
export const createMeeting = async (req, res) => {
    const { error } = validateMeeting(req.body);
    if (error) {
        return res.status(400).json({ success: false, errors: error.details.map(d => d.message) });
    }

    try {
        const meeting = await meetingService.createMeetingService({
            ...req.body,
            createdBy: req.user._id
        });

        // ✅ Log activity for all attendees
        if (meeting.attendees && meeting.attendees.length > 0) {
            for (const attendee of meeting.attendees) {
                // Don't log for the creator themselves
                if (attendee.user?.toString() !== req.user._id.toString()) {
                    await logActivity({
                        userId: attendee.user || attendee,
                        performedBy: req.user._id,
                        type: 'meeting_summary',
                        title: `New Meeting: ${meeting.title}`,
                        description: `${req.user.name} invited you to a meeting.`,
                        targetId: meeting._id,
                        targetType: 'Meeting',
                        actionType: 'view_details'
                    });
                }
            }
        }

        return res.status(201).json({ success: true, data: meeting });
    } catch (err) {
        console.error('[createMeeting]', err);
        return res.status(500).json({ success: false, message: err.message });
    }
};

// ── Start Meeting ──────────────────────────────────────────────────────────────
export const startMeeting = async (req, res) => {
    try {
        const meeting = await meetingService.startMeetingService(req.params.id);
        if (!meeting) {
            return res.status(404).json({ success: false, message: 'Meeting not found.' });
        }
        return res.status(200).json({ success: true, data: meeting });
    } catch (err) {
        console.error('[startMeeting]', err);
        return res.status(500).json({ success: false, message: err.message });
    }
};

// ── Update Meeting ─────────────────────────────────────────────────────────────
export const updateMeeting = async (req, res) => {
    if (!req.body || Object.keys(req.body).length === 0) {
        return res.status(400).json({ success: false, message: 'No data provided for update.' });
    }

    const { error } = validateMeetingUpdate(req.body);
    if (error) {
        return res.status(400).json({ success: false, errors: error.details.map(d => d.message) });
    }

    try {
        const meeting = await meetingService.updateMeetingService(req.params.id, req.body);
        if (!meeting) {
            return res.status(404).json({ success: false, message: 'Meeting not found.' });
        }
        return res.status(200).json({ success: true, data: meeting });
    } catch (err) {
        console.error('[updateMeeting]', err);
        return res.status(400).json({ success: false, message: err.message });
    }
};

// ── Delete Meeting ─────────────────────────────────────────────────────────────
export const deleteMeeting = async (req, res) => {
    try {
        const meeting = await meetingService.deleteMeetingService(req.params.id);
        if (!meeting) {
            return res.status(404).json({ success: false, message: 'Meeting not found.' });
        }
        return res.status(200).json({ success: true, message: 'Meeting and its log deleted.' });
    } catch (err) {
        console.error('[deleteMeeting]', err);
        return res.status(500).json({ success: false, message: err.message });
    }
};

// ── Get Meeting Log ────────────────────────────────────────────────────────────
export const getMeetingLog = async (req, res) => {
    try {
        const log = await meetingService.getMeetingLogService(req.params.id);
        if (!log) {
            return res.status(404).json({ success: false, message: 'Meeting log not found.' });
        }
        return res.status(200).json({ success: true, data: log });
    } catch (err) {
        console.error('[getMeetingLog]', err);
        return res.status(500).json({ success: false, message: err.message });
    }
};

// ── End Meeting ────────────────────────────────────────────────────────────
export const endMeeting = async (req, res) => {
    try {
        const meeting = await meetingService.endMeetingService(req.params.id);
        if (!meeting) {
            return res.status(404).json({ success: false, message: 'Meeting not found.' });
        }

        // ✅ Log summary-ready activity for all attendees
        if (meeting.attendees && meeting.attendees.length > 0) {
            for (const attendee of meeting.attendees) {
                await logActivity({
                    userId: attendee.user || attendee,
                    performedBy: req.user._id,
                    type: 'meeting_summary',
                    title: `Meeting Summary Ready - ${meeting.title}`,
                    description: `Meeting summary for "${meeting.title}" is being processed. Upload audio to complete.`,
                    targetId: meeting._id,
                    targetType: 'Meeting',
                    actionType: 'view_summary'
                });
            }
        }

        return res.status(200).json({
            success: true,
            data: meeting,
            message: 'Meeting ended. Upload audio to trigger AI processing.'
        });
    } catch (err) {
        console.error('[endMeeting]', err);
        return res.status(500).json({ success: false, message: err.message });
    }
};

// ── Process Audio (AI Summary Ready) ──────────────────────────────────────
export const processAudio = async (req, res) => {
    if (!req.file) {
        return res.status(400).json({
            success: false,
            message: 'No audio file uploaded. Use field name: audio'
        });
    }
 
    const { id: meetingId } = req.params;
    if (!isValidObjectId(meetingId)) {
        return res.status(400).json({ success: false, message: 'Invalid meetingId.' });
    }
 
    try {
        const meeting = await meetingService.getMeetingByIdService(meetingId);
        if (!meeting) {
            return res.status(404).json({ success: false, message: 'Meeting not found.' });
        }
 
        console.log(`[processAudio] Starting AI processing for meeting ${meetingId}...`);
 
        const result = await aiService.processAudioWithAI(
            meetingId,
            req.file.path,
            meeting.attendees
        );
 
        console.log(`[processAudio] AI done. ${result.insertedTasks.length} tasks created.`);
 
        // ✅ Log that AI summary is complete
        if (meeting.attendees && meeting.attendees.length > 0) {
            for (const attendee of meeting.attendees) {
                await logActivity({
                    userId: attendee.user || attendee,
                    performedBy: req.user._id,
                    type: 'meeting_summary',
                    title: `AI Summary Complete - ${meeting.title}`,
                    description: `Summary and ${result.insertedTasks.length} tasks extracted from the meeting.`,
                    targetId: meeting._id,
                    targetType: 'Meeting',
                    actionType: 'view_summary'
                });
            }
        }

        const log = await meetingService.getMeetingLogService(meetingId);
 
        return res.status(200).json({
            success: true,
            message: `Processing complete. ${result.insertedTasks.length} task(s) extracted and saved.`,
            data: {
                transcript:      log.transcript,
                summary:         log.summaryParagraph,
                summaryPoints:   log.summaryText,
                extracted_tasks: log.extracted_tasks,
                ai_status:       log.ai_status
            }
        });
 
    } catch (err) {
        console.error('[processAudio]', err);
        return res.status(500).json({
            success: false,
            message: 'AI processing failed: ' + err.message
        });
    }
};