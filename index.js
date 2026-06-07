import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import http from 'http'; // 1. استيراد الهيدر بتاع الـ HTTP
import { Server } from 'socket.io'; // 2. استيراد السوكيت
import mongoose from 'mongoose';
import helmet from 'helmet';
import morgan from 'morgan';
import cors from 'cors';

// Imports للـ Routes
import users from './routes/users.js';
import auth from './routes/auth.js';
import posts from './routes/posts.js';
import polls from './routes/poll.js';
import notifications from './routes/notification.js';
import reportRoutes from './routes/report/report.routes.js';
import companiesRoutes from './routes/companies.js';
import communitiesRoutes from './routes/communities.js';
import epicRoutes from './routes/epicRoutes.js';
import invitationsRoutes from './routes/invitations.js';
import projectRoutes from './routes/projects/project.routes.js';
import taskRoutes from './routes/tasks/task.routes.js';
import projectMemberRoutes from './routes/projectMembers/projectMember.routes.js';
import teamRoutes from './routes/teams/team.routes.js';
import fileAttachmentRoutes from './routes/files/fileAttachment.routes.js';
import activityLogRoutes from './routes/activityLogs/activityLog.routes.js';
import meetingRoutes from './routes/meetings/meeting.routes.js';
import boardRoutes from './routes/boards/board.routes.js';
import archiveRoutes from './routes/archive/archive.routes.js';
import messageRoutes from './routes/messages/message.routes.js'; // 3. استيراد راوت الرسايل الجديد

const app = express();

// عمل الـ Server الخارجي اللي هيربط Express مع Socket.io
const server = http.createServer(app); 

// app.use(cors({
//   origin: '*',
//   methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS' , 'PATCH'],
//   allowedHeaders: ['Content-Type', 'Authorization', 'x-auth-token'],
//   credentials: true
// }));
app.use(cors({
  origin: true, // يسمح تلقائياً بالـ origin المبعوت منه (مثل localhost:5173)
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-auth-token'],
  credentials: true
}));

// هامة جداً لـ Vercel لإنهاء طلبات Preflight فوراً بـ 200 قبل الـ Routes
app.options('*', cors());

// إعداد الـ Socket.io وتمرير الـ Server له
const io = new Server(server, {
  cors: {
    origin: '*', // تقدري تحددي بورت الفرونت إند هنا لو حابة حماية أكتر
    methods: ['GET', 'POST']
  }
});

// JWT key check
const jwtKey = process.env.JWT_PRIVATE_KEY;
if (!jwtKey) {
    console.error('FATAL ERROR: JWT_PRIVATE_KEY is not defined.');
    process.exit(1);
}

// DB connection
const dbURI = process.env.MONGODB_URI;
if (!dbURI) {
    console.error('FATAL ERROR: MONGODB_URI is not defined. Add it to your .env file.');
    process.exit(1);
}

mongoose.connect(dbURI, {
  tls: true,
  tlsInsecure: false,
  serverSelectionTimeoutMS: 30000,
  socketTimeoutMS: 30000,
  maxPoolSize: 10,
  minPoolSize: 1,
  maxIdleTimeMS: 45000,
})
  .then(() => console.log('Connected to Flowio MongoDB Atlas! 🚀'))
  .catch((err) => {
    console.error('DB Connection Error:', err.message);
    process.exit(1);
  });

// Models Imports
import './models/user.js';
import './models/epic.js';
import './models/company.js';
import './models/invitation.js';
import './models/post.js';
import './models/comment.js';
import './models/poll.js';
import './models/pollVote.js';
import './models/notification.js';
import './models/report.model.js';
import './models/project.model.js';
import './models/task.model.js';
import './models/projectMember.model.js';
import './models/team.model.js';
import './models/teamMember.model.js';
import './models/fileAttachment.model.js';
import './models/activityLog.model.js';
import './models/meeting.model.js';
import './models/meetingLog.model.js';
import './models/refreshToken.model.js';
import './models/board.model.js';
import './models/message.model.js'; // 4. استيراد الموديل الجديد هنا

// Middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));
app.use(helmet());

// ── Base Routes ────────────────────────────────────────────────────────────────
app.get('/', (req, res) => {
    res.status(200).json({
        success: true,
        message: 'Welcome to FLOWIO Backend API!',
        status: 'Server is running smoothly 🚀'
    });
});

app.get('/test-me', (req, res) => res.send('Everything is OK!'));

// ── API Routes ─────────────────────────────────────────────────────────────────
app.use('/api/users',       users);
app.use('/api/auth',        auth);
app.use('/api/companies',   companiesRoutes);
app.use('/api/communities', communitiesRoutes);
app.use('/api/epics',       epicRoutes);
app.use('/api/invitations', invitationsRoutes);
app.use('/api/posts',       posts);
app.use('/api/polls',       polls);
app.use('/api/notifications', notifications);
app.use('/api/reports',     reportRoutes);
app.use('/api/projects',    projectRoutes);
app.use('/api/projects/:projectId/tasks',   taskRoutes);
app.use('/api/tasks',       taskRoutes);
app.use('/api/projects/:projectId/members', projectMemberRoutes);
app.use('/api/teams',       teamRoutes);
app.use('/api/files',       fileAttachmentRoutes);
app.use('/api/activity',    activityLogRoutes);
app.use('/api/meetings',    meetingRoutes);
app.use('/api/boards',      boardRoutes);
app.use('/api/archive',     archiveRoutes);
app.use('/api/messages',    messageRoutes); // 5. تشغيل راوت الرسايل

if (app.get('env') === 'development') {
    app.use(morgan('tiny'));
    console.log('Morgan enabled...');
}

// ── Socket.io Logic ───────────────────────────────────────────────────────────
import messageController from './routes/messages/message.controller.js';

io.on('connection', (socket) => {
    // لما اليوزر يفتح شات روم معينة
    socket.on('join_room', (roomName) => {
        socket.join(roomName);
    });

    // استقبال رسايل الشات في الوقت الفعلي
    socket.on('send_message', async (data) => {
        try {
            const savedMessage = await messageController.handleIncomingMessage({
                room: data.room,
                sender: data.sender, // ده الـ User ID
                text: data.text
            });

            // بث الرسالة كاملة بعد الـ populate لكل اللي في الأوضة
            io.to(data.room).emit('receive_message', savedMessage);
        } catch (err) {
            socket.emit('error_status', { message: err.message });
        }
    });

    socket.on('disconnect', () => {});
});

// تشغيل الـ server بدلاً من app
if (process.env.NODE_ENV !== 'production') {
    const port = process.env.PORT || 4000;
    server.listen(port, () => console.log(`Flowio Server listening on port ${port}...`));
}

export default app;