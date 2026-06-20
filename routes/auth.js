import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import Joi from 'joi';
import bcrypt from 'bcrypt';
import crypto from 'crypto';
import nodemailer from 'nodemailer';

// Imports للموديلات - تم إضافة موديل الشركة بنجاح 🌟
import { User, validateForgotPassword, validateVerifyOtp, validatePasswordReset } from '../models/user.js';
import { Company } from '../models/company.js';
import { RefreshToken } from '../models/refreshToken.model.js';

import {
  generateAccessToken,
  generateRefreshToken,
  hashToken,
  getRefreshTokenExpiry
} from '../utils/tokenUtils.js';
import auth from '../middleware/auth.js';

const router = express.Router();

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD
  }
});

const subscriptionPlanEnum = {
  free: 'free',
  basic: 'basic',
  premium: 'premium'
};

// الـ Validation المعتمد والمتوافق مع الفرونت إند
function validateSignup(data) {
  const schema = Joi.object({
    name: Joi.string().min(3).max(50).required(),
    email: Joi.string().email().required(),
    password: Joi.string().min(6).required(),
    company: Joi.string().min(2).max(50).required(),
    role: Joi.string().valid('system-admin', 'project-manager', 'founder', 'team-member').optional(),
    specialization: Joi.string().valid('developer', 'designer', 'qa', 'none', 'Employee').optional()
  });
  return schema.validate(data);
}

function validateLogin(data) {
  const schema = Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().required()
  });
  return schema.validate(data);
}

// ========================================
// 1️⃣  POST /api/auth/signup (تم دمج وإنشاء الشركة تلقائياً)
// ========================================
router.post('/signup', async (req, res) => {
  const { error } = validateSignup(req.body);
  if (error) return res.status(400).json({ success: false, message: error.details[0].message });

  try {
    const { name, email, password, company, role, specialization } = req.body;

    // 1. التأكد من عدم تكرار الإيميل
    let user = await User.findOne({ email: email.toLowerCase() });
    if (user) return res.status(400).json({ success: false, message: 'User already exists with this email.' });

    // 2. عمل Hash للباسورد
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // 3. إنشاء الـ User
    user = new User({
      name,
      email: email.toLowerCase(),
      password: hashedPassword,
      role: role || 'team-member',
      specialization: specialization || 'none'
    });

    await user.save();

    // 4. إنشاء الـ Company تلقائياً بناءً على الـ Dropdown المبعوث
    const newCompany = await Company.create({
      name: `${name}'s Workplace`,
      industry: company,
      subscriptionPlan: subscriptionPlanEnum.free,
      userId: user._id
    });

    // 5. ربط الشركة بالـ User وحفظ التعديل
    user.companyId = newCompany._id;
    await user.save();

    // 6. توليد الـ Tokens
    const accessToken = generateAccessToken(user);
    const rawRefreshToken = generateRefreshToken();
    const hashedRefreshToken = hashToken(rawRefreshToken);

    await RefreshToken.create({
      userId: user._id,
      token: hashedRefreshToken,
      expiresAt: getRefreshTokenExpiry(),
      userAgent: req.headers['user-agent'] || '',
      ipAddress: req.ip || ''
    });

    return res.status(201).json({
      success: true,
      message: 'Account and Company created successfully!',
      token: accessToken,
      data: {
        accessToken,
        refreshToken: rawRefreshToken,
        user: {
          _id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          companyId: user.companyId,
          specialization: user.specialization
        }
      }
    });
  } catch (err) {
    console.error('[POST /auth/signup]', err);
    return res.status(500).json({ success: false, message: 'Error: ' + err.message });
  }
});

// ========================================
// 2️⃣  POST /api/auth/login
// ========================================
router.post('/login', async (req, res) => {
  const { error } = validateLogin(req.body);
  if (error) return res.status(400).json({ success: false, message: error.details[0].message });

  try {
    const user = await User.findOne({ email: req.body.email.toLowerCase() });
    if (!user) return res.status(401).json({ success: false, message: 'Invalid email or password.' });

    if (!user.password) return res.status(400).json({ success: false, message: 'This account uses Google sign-in.' });

    const validPassword = await bcrypt.compare(req.body.password, user.password);
    if (!validPassword) return res.status(401).json({ success: false, message: 'Invalid email or password.' });

    const accessToken = generateAccessToken(user);
    const rawRefreshToken = generateRefreshToken();
    const hashedRefreshToken = hashToken(rawRefreshToken);

    await RefreshToken.create({
      userId: user._id,
      token: hashedRefreshToken,
      expiresAt: getRefreshTokenExpiry(),
      userAgent: req.headers['user-agent'] || '',
      ipAddress: req.ip || ''
    });

    return res.status(200).json({
      success: true,
      token: accessToken,
      data: {
        accessToken,
        refreshToken: rawRefreshToken,
        user: {
          _id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          specialization: user.specialization,
          companyId: user.companyId
        }
      }
    });
  } catch (err) {
    console.error('[POST /auth/login]', err);
    return res.status(500).json({ success: false, message: 'Server error during login.' });
  }
});

// ========================================
// 3️⃣  POST /api/auth/refresh
// ========================================
router.post('/refresh', async (req, res) => {
  const { refreshToken } = req.body;
  if (!refreshToken) return res.status(400).json({ success: false, message: 'Refresh token is required.' });

  try {
    const hashedToken = hashToken(refreshToken);
    const storedToken = await RefreshToken.findOne({ token: hashedToken });

    if (!storedToken) return res.status(401).json({ success: false, message: 'Invalid or expired refresh token.' });

    if (storedToken.expiresAt < new Date()) {
      await RefreshToken.findByIdAndDelete(storedToken._id);
      return res.status(401).json({ success: false, message: 'Refresh token expired. Please log in again.' });
    }

    const user = await User.findById(storedToken.userId);
    if (!user) return res.status(401).json({ success: false, message: 'User no longer exists.' });

    await RefreshToken.findByIdAndDelete(storedToken._id);

    const newAccessToken = generateAccessToken(user);
    const newRawRefreshToken = generateRefreshToken();
    const newHashedRefreshToken = hashToken(newRawRefreshToken);

    await RefreshToken.create({
      userId: user._id,
      token: newHashedRefreshToken,
      expiresAt: getRefreshTokenExpiry(),
      userAgent: req.headers['user-agent'] || '',
      ipAddress: req.ip || ''
    });

    return res.status(200).json({
      success: true,
      data: {
        accessToken: newAccessToken,
        refreshToken: newRawRefreshToken
      }
    });
  } catch (err) {
    console.error('[POST /auth/refresh]', err);
    return res.status(500).json({ success: false, message: 'Server error during token refresh.' });
  }
});

// ========================================
// 4️⃣  POST /api/auth/logout
// ========================================
router.post('/logout', async (req, res) => {
  const { refreshToken } = req.body;
  if (!refreshToken) return res.status(400).json({ success: false, message: 'Refresh token is required.' });

  try {
    const hashedToken = hashToken(refreshToken);
    await RefreshToken.findOneAndDelete({ token: hashedToken });
    return res.status(200).json({ success: true, message: 'Logged out successfully.' });
  } catch (err) {
    console.error('[POST /auth/logout]', err);
    return res.status(500).json({ success: false, message: 'Server error during logout.' });
  }
});

// ========================================
// 5️⃣  POST /api/auth/logout-all
// ========================================
router.post('/logout-all', auth, async (req, res) => {
  try {
    const deleted = await RefreshToken.deleteMany({ userId: req.user._id });
    return res.status(200).json({
      success: true,
      message: `Logged out from all ${deleted.deletedCount} device(s).`
    });
  } catch (err) {
    console.error('[POST /auth/logout-all]', err);
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
});

// ========================================
// 6️⃣  POST /api/auth/forgot-password
//      الآن بيبعت كود OTP من 6 أرقام بالإيميل بدل اللينك
// ========================================
router.post('/forgot-password', async (req, res) => {
  try {
    const { error } = validateForgotPassword(req.body);
    if (error) return res.status(400).json({ success: false, message: error.details[0].message });

    const user = await User.findOne({ email: req.body.email.toLowerCase() });

    // ميرجعش معلومة بتأكد وجود الإيميل من عدمه، حماية للخصوصية
    if (!user) return res.status(200).json({ success: true, message: 'If this email exists, an OTP has been sent.' });

    const otp = user.generatePasswordResetOTP();
    await user.save();

    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: user.email,
      subject: 'Your Password Reset Code — Flowio',
      html: `
        <h2>Password Reset</h2>
        <p>Hello ${user.name},</p>
        <p>Your verification code is:</p>
        <h1 style="letter-spacing: 8px;">${otp}</h1>
        <p><strong>This code expires in 10 minutes.</strong></p>
        <p>If you didn't request this, you can safely ignore this email.</p>
      `
    });

    return res.status(200).json({ success: true, message: 'If this email exists, an OTP has been sent.' });
  } catch (err) {
    console.error('[POST /auth/forgot-password]', err);
    return res.status(500).json({ success: false, message: 'Error: ' + err.message });
  }
});

// ========================================
// 7️⃣  POST /api/auth/verify-otp (جديد)
//      بيتحقق من الكود من غير ما يغيّر الباسورد، علشان الفرونت يقدر
//      يعدّي للخطوة اللي بعدها (إدخال باسورد جديد) فوراً
// ========================================
router.post('/verify-otp', async (req, res) => {
  try {
    const { error } = validateVerifyOtp(req.body);
    if (error) return res.status(400).json({ success: false, message: error.details[0].message });

    const { email, otp } = req.body;
    const hashedOtp = crypto.createHash('sha256').update(otp).digest('hex');

    const user = await User.findOne({
      email: email.toLowerCase(),
      passwordResetOTP: hashedOtp,
      passwordResetExpires: { $gt: Date.now() }
    });

    if (!user) return res.status(400).json({ success: false, message: 'Invalid or expired code.' });

    return res.status(200).json({ success: true, message: 'Code verified successfully.' });
  } catch (err) {
    console.error('[POST /auth/verify-otp]', err);
    return res.status(500).json({ success: false, message: 'Error: ' + err.message });
  }
});

// ========================================
// 8️⃣  POST /api/auth/reset-password
//      دلوقتي بياخد email + otp + newPassword بدل resetToken
// ========================================
router.post('/reset-password', async (req, res) => {
  try {
    const { error } = validatePasswordReset(req.body);
    if (error) return res.status(400).json({ success: false, message: error.details[0].message });

    const { email, otp, newPassword } = req.body;
    const hashedOtp = crypto.createHash('sha256').update(otp).digest('hex');

    const user = await User.findOne({
      email: email.toLowerCase(),
      passwordResetOTP: hashedOtp,
      passwordResetExpires: { $gt: Date.now() }
    });

    if (!user) return res.status(400).json({ success: false, message: 'Invalid or expired code.' });

    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);
    user.passwordResetOTP = null;
    user.passwordResetExpires = null;
    await user.save();

    const accessToken = generateAccessToken(user);
    const rawRefreshToken = generateRefreshToken();
    const hashedRefreshToken = hashToken(rawRefreshToken);

    await RefreshToken.create({
      userId: user._id,
      token: hashedRefreshToken,
      expiresAt: getRefreshTokenExpiry(),
      userAgent: req.headers['user-agent'] || '',
      ipAddress: req.ip || ''
    });

    return res.status(200).json({
      success: true,
      message: 'Password reset successfully.',
      token: accessToken,
      data: {
        accessToken,
        refreshToken: rawRefreshToken,
        user: {
          _id: user._id,
          name: user.name,
          email: user.email,
          role: user.role
        }
      }
    });
  } catch (err) {
    console.error('[POST /auth/reset-password]', err);
    return res.status(500).json({ success: false, message: 'Error: ' + err.message });
  }
});

// ========================================
// 9️⃣  POST /api/auth/google (محدث لإنشاء شركة تلقائياً للمستخدمين الجدد)
// ========================================
router.post('/google', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ success: false, message: 'Email is required for Google authentication.' });

    let user = await User.findOne({ email: email.toLowerCase() });

    if (!user) {
      const defaultName = email.split('@')[0];
      user = new User({
        name: defaultName,
        email: email.toLowerCase(),
        password: undefined,
        specialization: 'Employee',
        role: 'team-member'
      });
      await user.save();

      // إنشاء شركة افتراضية للمسجل عن طريق جوجل كي لا يواجه مشاكل بالـ Dashboard
      const googleCompany = await Company.create({
        name: `${defaultName}'s Workplace`,
        industry: 'Startup',
        subscriptionPlan: subscriptionPlanEnum.free,
        userId: user._id
      });

      user.companyId = googleCompany._id;
      await user.save();
    }

    const accessToken = generateAccessToken(user);
    const rawRefreshToken = generateRefreshToken();
    const hashedRefreshToken = hashToken(rawRefreshToken);

    await RefreshToken.create({
      userId: user._id,
      token: hashedRefreshToken,
      expiresAt: getRefreshTokenExpiry(),
      userAgent: req.headers['user-agent'] || '',
      ipAddress: req.ip || ''
    });

    return res.status(200).json({
      success: true,
      message: 'Google authentication successful!',
      token: accessToken,
      data: {
        accessToken,
        refreshToken: rawRefreshToken,
        user: {
          _id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          companyId: user.companyId,
          specialization: user.specialization
        }
      }
    });
  } catch (err) {
    console.error('[POST /auth/google]', err);
    return res.status(500).json({ success: false, message: 'Error: ' + err.message });
  }
});

export default router;