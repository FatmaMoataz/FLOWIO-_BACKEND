const auth = require('../middleware/auth');
const { User, validate } = require('../models/user');
const jwt = require('jsonwebtoken');
const config = require('config');
const _ = require('lodash');
const bcrypt = require('bcrypt');
const express = require('express');
const router = express.Router();

// 1. نستخدم البواب (auth) عشان نأمن الـ Route
router.get('/me', auth, async (req, res) => {
  // 2. req.user._id جاية من الـ Token اللي البواب فكه
  // 3. .select('-password') عشان نرجع البيانات من غير الباسورد (أمان أكتر)
  const user = await User.findById(req.user._id).select('-password');
  res.send(user);
});
router.post('/', async (req, res) => {
    const { error } = validate(req.body);
    if (error) return res.status(400).send(error.details[0].message);

    let user = await User.findOne({ email: req.body.email });
    if (user) return res.status(400).send('User already registered.');

    user = new User(_.pick(req.body, ['name', 'email', 'password', 'role', 'specialization']));
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(user.password, salt);
    await user.save();

    // 1. توليد الـ Token لليوزر الجديد
    const token = jwt.sign({ _id: user._id }, config.get('jwtPrivateKey'));

    // 2. إرسال الـ Token في الـ Header والبيانات في الـ Body
    res.header('x-auth-token', token).send(_.pick(user, ['_id', 'name', 'email']));
});

module.exports = router;