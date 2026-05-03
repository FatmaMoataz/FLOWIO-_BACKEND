const config = require('config');
const express = require('express');
const mongoose = require('mongoose');
const helmet = require('helmet');
const morgan = require('morgan');
const users = require('./routes/users'); // ملف الـ Routes بتاع اليوزرز
const auth = require('./routes/auth'); // فكي الكومنت لما تعملي ملف الـ Login

const app = express();

// 1. التأكد من وجود الـ Private Key للأمان (الخطوة اللي موش عملها)
if (!config.get('jwtPrivateKey')) {
    console.error('FATAL ERROR: jwtPrivateKey is not defined.');
    process.exit(1);
}

// 2. الاتصال بالداتابيز (غيرنا الاسم لـ flowio عشان داتا المشروع تكون منفصلة)
const dbURI = 'mongodb+srv://shahdessam112233_db_user:shahdessam123456@cluster0.4pbf0y2.mongodb.net/flowio?retryWrites=true&w=majority';
mongoose.connect(dbURI)
  .then(() => console.log('Connected to Flowio MongoDB Atlas! 🚀'))
  .catch((err) => console.log('DB Connection Error: ', err.message));

// 3. Middlewares
app.use(express.json()); // مهم جداً عشان يقرأ الداتا اللي بتبعتيها في الـ Postman
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));
app.use(helmet());
app.use('/api/users', users);
app.use('/api/auth', auth); // فك الكومنت لما تعملي ملف الـ Login
app.use('/api/invitations', require('./routes/invitations'));
app.use('/api/communities', require('./routes/communities'));
app.use('/api/companies', require('./routes/companies'));

if (app.get('env') === 'development') {
    app.use(morgan('tiny'));
    console.log('Morgan enabled...');
}

const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`Flowio Server listening on port ${port}...`));