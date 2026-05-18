import auth from '../middleware/auth.js';
import { User, validate } from '../models/user.js';
import { generateAccessToken, generateRefreshToken, hashToken, getRefreshTokenExpiry } from '../utils/tokenUtils.js';
import { RefreshToken } from '../models/refreshToken.model.js'; // استيراد موديل الـ Refresh Token لحفظه بالـ DB
import _ from 'lodash';
import bcrypt from 'bcrypt';
import Joi from 'joi';
import express from 'express';

const router = express.Router();

// ── GET /api/users/me ──────────────────────────────────────────────────────────
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

// ── GET /api/users/search ──────────────────────────────────────────────────────
router.get('/search', auth, async (req, res) => {
    try {
        const { email } = req.query;
        if (!email) {
            return res.status(400).json({ success: false, message: 'Email query parameter is required.' });
        }

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
router.put('/me', auth, async (req, res) => {
    const { error } = validateProfileUpdate(req.body);
    if (error) {
        return res.status(400).json({ success: false, message: error.details[0].message });
    }

    try {
        const allowedFields = _.pick(req.body, ['name', 'specialization', 'companyId', 'avatar']);

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

// ── POST /api/users — Register (🌟 تم التحديث لدعم نظام الـ Tokens الجديد) ──
router.post('/', async (req, res) => {
    const { error } = validate(req.body);
    if (error) return res.status(400).json({ success: false, message: error.details[0].message });

    try {
        let user = await User.findOne({ email: req.body.email.toLowerCase() });
        if (user) return res.status(400).json({ success: false, message: 'User already registered.' });

        user = new User(_.pick(req.body, ['name', 'email', 'password', 'role', 'companyId']));

        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(user.password, salt);
        await user.save();

        // توليد الـ Tokens المعتمدة في النظام الجديد للـ Dashboard
        const accessToken = generateAccessToken(user);
        const rawRefreshToken = generateRefreshToken();

        // حفظ الـ Hashed Refresh Token في قاعدة البيانات لحماية الأمان
        const hashedRefresh = hashToken(rawRefreshToken);
        const expiresAt = getRefreshTokenExpiry();

        const storedRefreshToken = new RefreshToken({
            token: hashedRefresh,
            userId: user._id,
            expiresAt: expiresAt
        });
        await storedRefreshToken.save();

        // إرسال الـ Tokens للـ الفرونت إند بـ الهيكل الجديد الصحيح
        return res.status(201)
            .header('x-auth-token', accessToken)
            .json({
                success: true,
                message: 'User registered successfully.',
                accessToken,
                refreshToken: rawRefreshToken,
                user: _.pick(user, ['_id', 'name', 'email', 'role', 'companyId'])
            });
    } catch (err) {
        console.error('[POST /api/users]', err);
        return res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
});

// ── Joi Validation helpers ─────────────────────────────────────────────────────
function validateProfileUpdate(data) {
    const schema = Joi.object({
        name: Joi.string().min(3).max(50).optional(),
        specialization: Joi.string()
            .valid('developer', 'designer', 'qa', 'none')
            .optional(),
        companyId: Joi.string().hex().length(24).optional().allow(null),
        avatar: Joi.string().uri().optional().allow(null, ''),
    });
    return schema.validate(data);
}

function validatePasswordChange(data) {
    const schema = Joi.object({
        currentPassword: Joi.string().required().messages({ 'any.required': 'Current password is required.' }),
        newPassword: Joi.string().min(6).max(255).required().messages({
            'any.required': 'New password is required.',
            'string.min': 'New password must be at least 6 characters.'
        }),
        confirmPassword: Joi.string().valid(Joi.ref('newPassword')).required().messages({
            'any.only': 'Passwords do not match.',
            'any.required': 'Please confirm your new password.'
        })
    });
    return schema.validate(data);
}



export default router;