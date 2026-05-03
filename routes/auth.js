const jwt = require('jsonwebtoken');
const config = require('config'); // لازم تزودي السطر ده عشان يقرأ المفتاح السري
const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const Joi = require('joi');
const { User } = require('../models/user');
const _ = require('lodash');

// POST /api/auth - User Login
router.post('/', async (req, res) => {
    // 1. Validate input
    const { error } = validate(req.body);
    if (error) return res.status(400).send(error.details[0].message);

    // 2. Find user by email
    let user = await User.findOne({ email: req.body.email });
    if (!user) return res.status(400).send('Invalid email or password.');

    // 3. Compare hashed password
    const validPassword = await bcrypt.compare(req.body.password, user.password);
    if (!validPassword) return res.status(400).send('Invalid email or password.');

    // 4. Generate JWT باستخدام الـ Method الجديدة
    const token = user.generateAuthToken(); 

    // 5. إرسال الـ Header والرد
    res.header('x-auth-token', token).send({
        message: 'Logged in successfully! 🚀',
        user: _.pick(user, ['_id', 'name', 'email']) // حركة Lodash اللي موش بيحبها
    });
});

function validate(req) {
    const schema = Joi.object({
        email: Joi.string().min(5).max(255).required().email(),
        password: Joi.string().min(6).max(255).required()
    });
    return schema.validate(req);
}

module.exports = router;