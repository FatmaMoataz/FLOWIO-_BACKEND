const express = require('express');
const mongoose = require('mongoose'); 

const app = express();
const port = 5000;

// 1. الربط بالداتابيز
const dbURI = 'mongodb+srv://shahdessam112233_db_user:DzPc2MbkIvnjIg8j@cluster0.4pbf0y2.mongodb.net/testDatabase?retryWrites=true&w=majority';

mongoose.connect(dbURI)
  .then(() => console.log('Connected to MongoDB Atlas! 🚀'))
  .catch((err) => console.log('DB Connection Error: ', err));

// 2. تعريف الـ Schema والـ Model (لازم يبقوا فوق)
const userSchema = new mongoose.Schema({
    name: String,
    age: Number,
    email: String
});
const User = mongoose.model('User', userSchema);

// 3. المسارات (Routes)
app.get('/', (req, res) => {
  res.send('Welcome to my first Node.js Server! 🚀');
});

app.get('/add-user', async (req, res) => {
    try {
        const newUser = new User({
            name: "Shahd Essam",
            age: 22,
            email: "shahd@example.com"
        });

        await newUser.save(); 
        res.send('User added to Database successfully! 💎');
    } catch (error) {
        res.status(500).send('Error adding user: ' + error);
    }
});

// 4. تشغيل السيرفر (لازم يكون آخر حاجة تحت خالص)
app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});

