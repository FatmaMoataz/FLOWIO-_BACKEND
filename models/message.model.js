import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema({
    room: {
        type: String,
        required: true,
        index: true 
    },
    sender: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User', // اسم موديل المستخدمين عندك في السيستم
        required: true
    },
    text: {
        type: String,
        required: true
    }
}, { 
    timestamps: true 
});

const Message = mongoose.model('Message', messageSchema);
export default Message;