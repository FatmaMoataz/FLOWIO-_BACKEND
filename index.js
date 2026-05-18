require('dotenv').config();
const config = require('config');
const express = require('express');
const mongoose = require('mongoose');
const helmet = require('helmet');
const morgan = require('morgan');
const cors = require('cors');

const users = require('./routes/users');
const auth = require('./routes/auth');
const posts = require('./routes/posts');
const polls = require('./routes/poll');
const notifications = require('./routes/notification');

const app = express();
app.use(cors());

// JWT key check
try {
    const jwtKey = config.get('jwtPrivateKey');
    if (!jwtKey) throw new Error('jwtPrivateKey is empty');
} catch (err) {
    console.error('FATAL ERROR: jwtPrivateKey is not defined.');
    process.exit(1);
}

// DB connection — using MONGODB_URI (Atlas)
const dbURI = process.env.MONGODB_URI;
if (!dbURI) {
    console.error('FATAL ERROR: MONGODB_URI is not defined. Add it to your .env file.');
    process.exit(1);
}

mongoose.connect(dbURI)
  .then(() => console.log('Connected to Flowio MongoDB Atlas! 🚀'))
  .catch((err) => console.log('DB Connection Error: ', err.message));

// Models
require('./models/user');
require('./models/epic');
require('./models/company');
require('./models/invitation');
require('./models/post');
require('./models/comment');
require('./models/poll');
require('./models/pollVote');
require('./models/notification');
require('./models/project.model');
require('./models/task.model');
require('./models/projectMember.model');
require('./models/team.model');
require('./models/teamMember.model');
require('./models/fileAttachment.model');
require('./models/activityLog.model');
require('./models/meeting.model');
require('./models/meetingLog.model');
require('./models/refreshToken.model');
require('./models/board.model');

// Middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));
app.use(helmet());

// Routes
app.get('/test-me', (req, res) => res.send('Everything is OK!'));

app.use('/api/users',       users);
app.use('/api/auth',        auth);
app.use('/api/companies',   require('./routes/companies'));
app.use('/api/communities', require('./routes/communities.js'));
app.use('/api/epics',       require('./routes/epicRoutes.js'));
app.use('/api/invitations', require('./routes/invitations'));
app.use('/api/posts',       posts);
app.use('/api/polls',       require('./routes/poll'));
app.use('/api/notifications', notifications);
app.use('/api/projects',    require('./routes/projects/project.routes'));
app.use('/api/projects/:projectId/tasks',   require('./routes/tasks/task.routes'));
app.use('/api/tasks',       require('./routes/tasks/task.routes'));
app.use('/api/projects/:projectId/members', require('./routes/projectMembers/projectMember.routes'));
app.use('/api/teams',       require('./routes/teams/team.routes'));
app.use('/api/files',       require('./routes/files/fileAttachment.routes'));
app.use('/api/activity',    require('./routes/activityLogs/activityLog.routes'));
app.use('/api/meetings',    require('./routes/meetings/meeting.routes'));
app.use('/api/boards',      require('./routes/boards/board.routes'));

if (app.get('env') === 'development') {
    app.use(morgan('tiny'));
    console.log('Morgan enabled...');
}

const port = process.env.PORT || 4000;
app.listen(port, () => console.log(`Flowio Server listening on port ${port}...`));