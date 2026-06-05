import auth from '../middleware/auth.js';
import { User, validate } from '../models/user.js';
import jwt from 'jsonwebtoken';
import _ from 'lodash';
import bcrypt from 'bcrypt';
import Joi from 'joi';
import express from 'express';

const router = express.Router();

// ── GET /api/users/me ──────────────────────────────────────────────────────────
// Get current logged-in user's full profile
router.get('/me', auth, async (req, res) => {
    try {
        const user = await User.findById(req.user._id)
            .select('-password')
            .populate('companyId', 'name industry');
        if (!user) return res.status(404).json({ success: false, message: 'User not found.' });
        return res.status(200).json({ success: true, data: user });
    } catch (err) {
        console.error('[GET /users/me]', err);
        return res.status(500).json({ success: false, message: err.message });
    }
});

// ── 🌟 جـديـد: GET /api/users/search ──────────────────────────────────────────
// البحث عن مستخدم بواسطة البريد الإلكتروني (يجب وضعه فوق راوت /:id لمنع التعارض)
router.get('/search', auth, async (req, res) => {
    try {
        const { email } = req.query;
        if (!email) {
            return res.status(400).json({ success: false, message: 'Email query parameter is required.' });
        }

        // البحث عن المستخدم باستخدام الإيميل الممرر (بدون حساسّية لحالة الأحرف)
        const user = await User.findOne({ email: email.trim().toLowerCase() })
            .select('_id name email specialization');

        if (!user) {
            return res.status(404).json({ success: false, message: 'No user found with this email.' });
        }

        return res.status(200).json({ success: true, data: user });
    } catch (err) {
        console.error('[GET /users/search]', err);
        return res.status(500).json({ success: false, message: err.message });
    }
});

// ── PUT /api/users/me ──────────────────────────────────────────────────────────
// Update current user's profile (name, specialization, companyId)
router.put('/me', auth, async (req, res) => {
    const { error } = validateProfileUpdate(req.body);
    if (error) {
        return res.status(400).json({ success: false, message: error.details[0].message });
    }

    try {
        const allowedFields = _.pick(req.body, ['name', 'specialization', 'companyId']);

        const user = await User.findByIdAndUpdate(
            req.user._id,
            { $set: allowedFields },
            { new: true, runValidators: true }
        ).select('-password').populate('companyId', 'name industry');

        if (!user) return res.status(404).json({ success: false, message: 'User not found.' });

        return res.status(200).json({ success: true, data: user });
    } catch (err) {
        console.error('[PUT /users/me]', err);
        return res.status(500).json({ success: false, message: err.message });
    }
});

// ── PUT /api/users/me/password ─────────────────────────────────────────────────
// Change password — requires current password for verification
router.put('/me/password', auth, async (req, res) => {
    const { error } = validatePasswordChange(req.body);
    if (error) {
        return res.status(400).json({ success: false, message: error.details[0].message });
    }

    try {
        const user = await User.findById(req.user._id);
        if (!user) return res.status(404).json({ success: false, message: 'User not found.' });

        const validPassword = await bcrypt.compare(req.body.currentPassword, user.password);
        if (!validPassword) {
            return res.status(400).json({ success: false, message: 'Current password is incorrect.' });
        }

        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(req.body.newPassword, salt);
        await user.save();

        return res.status(200).json({ success: true, message: 'Password updated successfully.' });
    } catch (err) {
        console.error('[PUT /users/me/password]', err);
        return res.status(500).json({ success: false, message: err.message });
    }
});

// ── GET /api/users/:id ─────────────────────────────────────────────────────────
// Get any user's public profile — (تأتي بالأسفل حتى لا تبتلع مسار /search)
router.get('/:id', auth, async (req, res) => {
    try {
        const user = await User.findById(req.params.id)
            .select('-password')
            .populate('companyId', 'name industry');
        if (!user) return res.status(404).json({ success: false, message: 'User not found.' });
        return res.status(200).json({ success: true, data: user });
    } catch (err) {
        console.error('[GET /users/:id]', err);
        return res.status(500).json({ success: false, message: err.message });
    }
});

// ── POST /api/users — Register ─────────────────────────────────────────────────
router.post('/', async (req, res) => {
    const { error } = validate(req.body);
    if (error) return res.status(400).send(error.details[0].message);

    let user = await User.findOne({ email: req.body.email });
    if (user) return res.status(400).send('User already registered.');

    user = new User(_.pick(req.body, ['name', 'email', 'password', 'role', 'companyId']));

    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(user.password, salt);
    await user.save();

    const token = jwt.sign({ _id: user._id }, process.env.JWT_PRIVATE_KEY);
    res.header('x-auth-token', token).send(_.pick(user, ['_id', 'name', 'email', 'role']));
});

// ── Joi Validation helpers ─────────────────────────────────────────────────────
function validateProfileUpdate(data) {
    const schema = Joi.object({
        name: Joi.string().min(3).max(50).optional(),
        specialization: Joi.string()
            .valid('developer', 'designer', 'qa', 'none')
            .optional(),
        companyId: Joi.string().hex().length(24).optional().allow(null)
    });
    return schema.validate(data);
}

function validatePasswordChange(data) {
    const schema = Joi.object({
        currentPassword: Joi.string().required().messages({
            'any.required': 'Current password is required.'
        }),
        newPassword: Joi.string().min(6).max(255).required().messages({
            'any.required': 'New password is required.',
            'string.min':   'New password must be at least 6 characters.'
        }),
        confirmPassword: Joi.string().valid(Joi.ref('newPassword')).required().messages({
            'any.only':     'Passwords do not match.',
            'any.required': 'Please confirm your new password.'
        })
    });
    return schema.validate(data);
}

export default router;