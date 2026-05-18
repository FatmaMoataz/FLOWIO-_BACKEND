const meetingService = require('./meeting.service');
const aiService = require('./aiIntegration.service');
const { validateMeeting, validateMeetingUpdate } = require('../../models/meeting.model');
const { logActivity } = require('../activityLogs/activityLog.service');

const isValidObjectId = (id) => /^[0-9a-fA-F]{24}$/.test(id);

// ── Create Meeting ─────────────────────────────────────────────────────────────

const createMeeting = async (req, res) => {
    const { error } = validateMeeting(req.body);
    if (error) {
        return res.status(400).json({ success: false, errors: error.details.map(d => d.message) });
    }

    try {
        const meeting = await meetingService.createMeetingService({
            ...req.body,
            createdBy: req.user._id
        });

        await logActivity(req.user._id, 'meeting', meeting._id, 'created',
            `${req.user.name} created meeting '${meeting.title}'`);

        return res.status(201).json({ success: true, data: meeting });
    } catch (err) {
        console.error('[createMeeting]', err);
        return res.status(500).json({ success: false, message: err.message });
    }
};

// ── Get All Meetings for a Project ─────────────────────────────────────────────

const getMeetingsByProject = async (req, res) => {
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

const getMeetingById = async (req, res) => {
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

// ── Start Meeting ──────────────────────────────────────────────────────────────

const startMeeting = async (req, res) => {
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

// ── End Meeting ────────────────────────────────────────────────────────────────

const endMeeting = async (req, res) => {
    try {
        const meeting = await meetingService.endMeetingService(req.params.id);
        if (!meeting) {
            return res.status(404).json({ success: false, message: 'Meeting not found.' });
        }

        await logActivity(req.user._id, 'meeting', meeting._id, 'updated',
            `${req.user.name} ended meeting '${meeting.title}' (${meeting.duration} min)`);

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

// ── Update Meeting ─────────────────────────────────────────────────────────────

const updateMeeting = async (req, res) => {
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

const deleteMeeting = async (req, res) => {
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

// ── Upload Audio + Trigger AI ──────────────────────────────────────────────────
// After a meeting ends, the frontend uploads the recorded audio.
// This endpoint sends it to the Python AI service for processing.

const processAudio = async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ success: false, message: 'No audio file uploaded. Use field name: audio' });
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

        // Respond immediately — AI processing is async and takes time
        res.status(202).json({
            success: true,
            message: 'Audio received. AI processing started. Check /api/meetings/:id/log for results.'
        });

        // Run AI in background — don't await in the response chain
        aiService.processAudioWithAI(meetingId, req.file.path, meeting.attendees)
            .catch(err => console.error('[processAudio background]', err.message));

    } catch (err) {
        console.error('[processAudio]', err);
        return res.status(500).json({ success: false, message: err.message });
    }
};

// ── Get Meeting Log (AI results) ───────────────────────────────────────────────

const getMeetingLog = async (req, res) => {
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

module.exports = {
    createMeeting,
    getMeetingsByProject,
    getMeetingById,
    startMeeting,
    endMeeting,
    updateMeeting,
    deleteMeeting,
    processAudio,
    getMeetingLog
};