import express from 'express';
import multer from 'multer';
import os from 'os'; // 👈 استيراد موديل نظام التشغيل المدمج في Node.js
import { v4 as uuidv4 } from 'uuid';

// إضافة امتداد .js للملفات والـ Middlewares المحلية إجباري
import auth from '../../middleware/auth.js';
import * as meetingController from './meeting.controller.js';
import * as summaryController from './summary.controller.js';

// ── Audio upload middleware ───────────────────────────────────────────────────
// os.tmpdir() بيضمن اختيار مجلد مؤقت آمن متوافق مع الويندوز ولوكال وفي نفس الوقت ممتاز لـ Vercel
const audioUpload = multer({
    dest: os.tmpdir(), 
    limits: { fileSize: 500 * 1024 * 1024 }, // 500MB max for audio
    fileFilter: (req, file, cb) => {
        const allowed = ['audio/webm', 'audio/mp4', 'audio/mpeg', 'audio/wav', 'audio/ogg'];
        allowed.includes(file.mimetype) ? cb(null, true) : cb(new Error('Invalid audio format'));
    }
});

const router = express.Router();
router.use(auth);

// باقي الـ Routes زي ما هي بالظبط...
router.post('/',                                            meetingController.createMeeting);
router.get('/project/:projectId',                           meetingController.getMeetingsByProject);
router.get('/:id',                                          meetingController.getMeetingById);
router.put('/:id',                                          meetingController.updateMeeting);
router.delete('/:id',                                       meetingController.deleteMeeting);

router.patch('/:id/start',                  meetingController.startMeeting);
router.patch('/:id/end',                    meetingController.endMeeting);

router.post('/:id/process-audio', audioUpload.single('audio'), meetingController.processAudio);
router.get('/:id/log',            meetingController.getMeetingLog);

router.post('/:id/summary', summaryController.saveSummary);
router.get('/:id/summary',  summaryController.getSummary);

export default router;