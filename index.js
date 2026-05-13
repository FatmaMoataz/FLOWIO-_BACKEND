require('dotenv').config(); // لازم يكون أول سطر في الملف
const config = require('config');
const express = require('express');
const mongoose = require('mongoose');
const helmet = require('helmet');
const morgan = require('morgan');
const users = require('./routes/users'); // ملف الـ Routes بتاع اليوزرز
const auth = require('./routes/auth'); // فكي الكومنت لما تعملي ملف الـ Login
const posts = require('./routes/post'); // ملف الـ Routes بتاع البوستات
const polls = require('./routes/poll'); // ملف الـ Routes بتاع الاستفتاءات
const cors = require('cors');

app.use(cors()); // تمكين CORS للسماح بالطلبات من الواجهة الأمامية

const app = express();
// التأكد من وجود الـ Private Key للأمان
try {
    const jwtKey = config.get('jwtPrivateKey');
    if (!jwtKey) {
        throw new Error('jwtPrivateKey is empty');
    }
} catch (err) {
    console.error('FATAL ERROR: jwtPrivateKey is not defined. Set the flowio_jwtPrivateKey environment variable or update config/default.json');
    process.exit(1);
}

// 2. الاتصال بالداتابيز (غيرنا الاسم لـ flowio عشان داتا المشروع تكون منفصلة)
const dbURI = 'mongodb+srv://shahdessam112233_db_user:shahdessam123456@cluster0.4pbf0y2.mongodb.net/flowio?retryWrites=true&w=majority';
mongoose.connect(dbURI)
  .then(() => console.log('Connected to Flowio MongoDB Atlas! 🚀'))
  .catch((err) => console.log('DB Connection Error: ', err.message));
require('./models/user');
require('./models/epic');
require('./models/company'); // Temporarily disabled
require('./models/invitation');
require('./models/post');
// With your other model requires
require('./models/project.model');
// With your other model requires
require('./models/task.model');

// 3. Middlewares
app.use(express.json()); // مهم جداً عشان يقرأ الداتا اللي بتبعتيها في الـ Postman
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));
app.use(helmet());

// Routes
app.get('/test-me', (req, res) => {
    res.send('Everything is OK!');
});

app.use('/api/users', users);
app.use('/api/auth', auth); // فك الكومنت لما تعملي ملف الـ Login
app.use('/api/companies', require('./routes/companies'));
app.use('/api/communities', require('./routes/communities.js'));
app.use('/api/epics', require('./routes/epicRoutes.js'));
app.use('/api/invitations', require('./routes/invitations'));
app.use('/api/posts', require('./routes/posts/post'));
app.use('/api/polls', polls);
// With your other route mounts
app.use('/api/projects', require('./routes/projects/project.routes'));
app.use('/api/projects/:projectId/tasks', require('./routes/tasks/task.routes'));
if (app.get('env') === 'development') {
    app.use(morgan('tiny'));
    console.log('Morgan enabled...');
}

const port = process.env.PORT || 4000;
app.listen(port, () => console.log(`Flowio Server listening on port ${port}...`));