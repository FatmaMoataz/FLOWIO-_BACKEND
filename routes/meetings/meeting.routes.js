import express from 'express';
import multer from 'multer';
import os from 'os';
import { v4 as uuidv4 } from 'uuid';

import auth from '../../middleware/auth.js';
import * as meetingController from './meeting.controller.js';
import * as summaryController from './summary.controller.js';

const audioUpload = multer({
    dest: os.tmpdir(), 
    limits: { fileSize: 500 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
        const allowed = ['audio/webm', 'audio/mp4', 'audio/mpeg', 'audio/wav', 'audio/ogg'];
        allowed.includes(file.mimetype) ? cb(null, true) : cb(new Error('Invalid audio format'));
    }
});

const router = express.Router();
router.use(auth);

// ✅ SPECIFIC ROUTES FIRST (with sub-paths)
router.post('/',                                            meetingController.createMeeting);
router.get('/project/:projectId',                           meetingController.getMeetingsByProject);

// ✅ MORE SPECIFIC ROUTES
router.post('/:id/process-audio', audioUpload.single('audio'), meetingController.processAudio);
router.get('/:id/log',                                      meetingController.getMeetingLog);
router.post('/:id/summary',                                 summaryController.saveSummary);
router.get('/:id/summary',                                  summaryController.getSummary);

router.patch('/:id/start',                                  meetingController.startMeeting);
router.patch('/:id/end',                                    meetingController.endMeeting);

// ✅ GENERIC ROUTES LAST (only :id parameter)
router.put('/:id',                                          meetingController.updateMeeting);
router.delete('/:id',                                       meetingController.deleteMeeting);
router.get('/:id',                                          meetingController.getMeetingById);

export default router;