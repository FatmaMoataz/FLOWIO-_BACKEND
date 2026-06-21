import express from 'express';
import auth from '../../middleware/auth.js';
import { sendMessage, getHistory } from './chat.controller.js';

const router = express.Router();

// All chat routes require authentication — req.user._id is needed to scope sessions
router.use(auth);

// POST /api/chat/message            → send a message, get AI reply
// GET  /api/chat/history/:projectId → load previous conversation for this project

router.post('/message', sendMessage);
router.get('/history/:projectId', getHistory);

export default router;