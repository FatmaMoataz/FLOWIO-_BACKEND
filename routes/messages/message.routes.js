import express from 'express';
import messageController from './message.controller.js';
// لو عندك ميردلوير حماية زي auth تقدري تضيفيه هنا عشان مفيش حد غريب يجيب الشات
import auth from '../../middleware/auth.js'; 

const router = express.Router();

// الرابط هيبقى: GET /api/messages/:room
router.get('/:room', messageController.getChatHistory);

export default router;