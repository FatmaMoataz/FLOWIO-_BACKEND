import { sendMessageService, getHistoryService } from './chat.service.js';
import { validateChatMessageInput } from '../../models/chatSession.model.js';

const isValidObjectId = (id) => /^[0-9a-fA-F]{24}$/.test(id);

// ── POST /api/chat/message ──────────────────────────────────────────────────────

const sendMessage = async (req, res) => {
    const { error } = validateChatMessageInput(req.body);
    if (error) {
        return res.status(400).json({ success: false, errors: error.details.map(d => d.message) });
    }

    const { projectId, message } = req.body;

    try {
        const result = await sendMessageService(projectId, req.user._id, message);

        return res.status(200).json({
            success: true,
            data: {
                sessionId: result.sessionId,
                reply: {
                    text:      result.assistantMessage.text,
                    role:      result.assistantMessage.role,
                    createdAt: result.assistantMessage.createdAt,
                    isError:   result.assistantMessage.isError
                }
            }
        });
    } catch (err) {
        console.error('[sendMessage]', err);

        // Project not found is a client error (400), everything else is server (500)
        const status = err.message.includes('Project not found') ? 404 : 500;
        return res.status(status).json({ success: false, message: err.message });
    }
};

// ── GET /api/chat/history/:projectId ───────────────────────────────────────────

const getHistory = async (req, res) => {
    const { projectId } = req.params;

    if (!isValidObjectId(projectId)) {
        return res.status(400).json({ success: false, message: 'Invalid projectId.' });
    }

    try {
        const result = await getHistoryService(projectId, req.user._id);
        return res.status(200).json({ success: true, data: result });
    } catch (err) {
        console.error('[getHistory]', err);
        return res.status(500).json({ success: false, message: err.message });
    }
};

export { sendMessage, getHistory };