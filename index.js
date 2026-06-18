import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import mongoose from 'mongoose';
import helmet from 'helmet';
import morgan from 'morgan';
import cors from 'cors';

// Imports للـ Routes (مع إضافة امتداد .js)
import users from './routes/users.js';
import auth from './routes/auth.js';
import posts from './routes/posts.js';
import polls from './routes/poll.js';
import notifications from './routes/notification.js';
import reportRoutes from './routes/report/report.routes.js';

// Imports للـ Routes اللي كانت بتستدعى جوه الـ app.use مباشرة
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
import activityRoutes from './routes/activityLogs/activityLog.routes.js';

const app = express();
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-auth-token'],
  credentials: true
}));

// JWT key check - use environment variable
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
    process.exit(1);  // Exit if DB connection fails
  });

// Models Imports (لازم يستدعوا عشان الـ Schemas تتسجل في المونجوس)
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

// Middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));
app.use(helmet());

// ── Base Routes ────────────────────────────────────────────────────────────────
// الدالة الترحيبية لمنع الـ 404 عند الدخول على الرابط الرئيسي مباشرة
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
app.use('/api/activities', activityRoutes);

if (app.get('env') === 'development') {
    app.use(morgan('tiny'));
    console.log('Morgan enabled...');
}

// Only listen locally (not on Vercel)
if (process.env.NODE_ENV !== 'production') {
    const port = process.env.PORT || 4000;
    app.listen(port, () => console.log(`Flowio Server listening on port ${port}...`));
}

// Export default بدل module.exports عشان تناسب الـ ES6
export default app;