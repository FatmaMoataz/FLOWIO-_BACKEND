import messageService from './message.service.js';
import { validateMessage } from '../../validations/messageValidation.js';

class MessageController {
    async getChatHistory(req, res) {
        try {
            const { room } = req.params;
            if (!room) return res.status(400).json({ error: "اسم الغرفة مطلوب" });

            const history = await messageService.getRoomMessages(room);
            return res.status(200).json(history);
        } catch (error) {
            return res.status(500).json({ error: "حدث خطأ أثناء جلب الرسايل" });
        }
    }

    async handleIncomingMessage(data) {
        const { error } = validateMessage(data);
        if (error) {
            throw new Error(error.details[0].message);
        }
        return await messageService.createMessage(data);
    }
}

export default new MessageController();