import Message from '../../models/message.model.js';

class MessageService {
    async createMessage(messageData) {
        const newMessage = new Message(messageData);
        await newMessage.save();
        // بنعمل populate للرسالة الجديدة بعد حفظها عشان ترجع كاملة باليوزر بتاعها فوراً للـ Sockets
        return await newMessage.populate('sender', 'name avatar'); 
    }

    async getRoomMessages(roomName) {
        return await Message.find({ room: roomName })
            .populate('sender', 'name avatar') // بيجيب بيانات اليوزر تلقائي بدل الـ ID بس
            .sort({ createdAt: 1 });
    }
}

export default new MessageService();