const express = require('express');
const auth = require('../../middleware/auth');
const meetingController = require('./meeting.controller');

// Audio upload middleware — reuse existing multer but accept audio types
const multer = require('multer');
const audioUpload = multer({
    dest: 'uploads/audio/',
    limits: { fileSize: 500 * 1024 * 1024 }, // 500MB max for audio
    fileFilter: (req, file, cb) => {
        const allowed = ['audio/webm', 'audio/mp4', 'audio/mpeg', 'audio/wav', 'audio/ogg'];
        allowed.includes(file.mimetype) ? cb(null, true) : cb(new Error('Invalid audio format'));
    }
});

const router = express.Router();
router.use(auth);

// ── Meeting CRUD ───────────────────────────────────────────────────────────────
// POST   /api/meetings                          → create meeting
// GET    /api/meetings/project/:projectId       → all meetings for a project
// GET    /api/meetings/:id                      → single meeting
// PUT    /api/meetings/:id                      → update meeting
// DELETE /api/meetings/:id                      → delete meeting

router.post('/',                            meetingController.createMeeting);
router.get('/project/:projectId',           meetingController.getMeetingsByProject);
router.get('/:id',                          meetingController.getMeetingById);
router.put('/:id',                          meetingController.updateMeeting);
router.delete('/:id',                       meetingController.deleteMeeting);

// ── Meeting Lifecycle ──────────────────────────────────────────────────────────
// PATCH  /api/meetings/:id/start             → mark as live
// PATCH  /api/meetings/:id/end               → mark as ended + calc duration

router.patch('/:id/start',                  meetingController.startMeeting);
router.patch('/:id/end',                    meetingController.endMeeting);

// ── AI Integration ─────────────────────────────────────────────────────────────
// POST   /api/meetings/:id/process-audio     → upload audio → trigger AI
// GET    /api/meetings/:id/log               → get AI results (transcript, summary, tasks)

router.post('/:id/process-audio', audioUpload.single('audio'), meetingController.processAudio);
router.get('/:id/log',            meetingController.getMeetingLog);

module.exports = router;

// ── Summary Routes (added for Summary Module) ──────────────────────────────────
const summaryController = require('./summary.controller');

// POST /api/meetings/:id/summary  → save AI or manual summary + create tasks
// GET  /api/meetings/:id/summary  → fetch summary, transcript, action items
router.post('/:id/summary', summaryController.saveSummary);
router.get('/:id/summary',  summaryController.getSummary);