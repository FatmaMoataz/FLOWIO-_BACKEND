const express = require('express');
const Joi     = require('joi');
const bcrypt  = require('bcrypt');
const crypto  = require('crypto');
const config  = require('config');
const router  = express.Router();
const nodemailer = require('nodemailer');

const { User, validateForgotPassword, validatePasswordReset } = require('../models/user');
const { RefreshToken } = require('../models/refreshToken.model');
const {
  generateAccessToken,
  generateRefreshToken,
  hashToken,
  verifyAccessToken,
  getRefreshTokenExpiry
} = require('../utils/tokenUtils');
const auth = require('../middleware/auth');

// ── Email transporter ─────────────────────────────────────────────────────────
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: config.get('emailUser'),
    pass: config.get('emailPassword')
  }
});

// ── Joi validation ────────────────────────────────────────────────────────────
function validateLogin(data) {
  const schema = Joi.object({
    email:    Joi.string().email().required(),
    password: Joi.string().required()
  });
  return schema.validate(data);
}

// ========================================
// 1️⃣  POST /api/auth/login
// ========================================
router.post('/login', async (req, res) => {
  const { error } = validateLogin(req.body);
  if (error) return res.status(400).json({ success: false, message: error.details[0].message });

  try {
    const user = await User.findOne({ email: req.body.email });
    if (!user) return res.status(401).json({ success: false, message: 'Invalid email or password.' });

    // Google-only accounts have no password
    if (!user.password) return res.status(400).json({ success: false, message: 'This account uses Google sign-in.' });

    const validPassword = await bcrypt.compare(req.body.password, user.password);
    if (!validPassword) return res.status(401).json({ success: false, message: 'Invalid email or password.' });

    const accessToken        = generateAccessToken(user);
    const rawRefreshToken    = generateRefreshToken();
    const hashedRefreshToken = hashToken(rawRefreshToken);

    await RefreshToken.create({
      userId:    user._id,
      token:     hashedRefreshToken,
      expiresAt: getRefreshTokenExpiry(),
      userAgent: req.headers['user-agent'] || '',
      ipAddress: req.ip || ''
    });

    return res.status(200).json({
      success: true,
      data: {
        accessToken,
        refreshToken: rawRefreshToken,
        user: {
          _id:            user._id,
          name:           user.name,
          email:          user.email,
          role:           user.role,
          specialization: user.specialization,
          companyId:      user.companyId
        }
      }
    });
  } catch (err) {
    console.error('[POST /auth/login]', err);
    return res.status(500).json({ success: false, message: 'Server error during login.' });
  }
});

// ========================================
// 2️⃣  POST /api/auth/refresh
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

    // Token rotation — delete old, issue new
    await RefreshToken.findByIdAndDelete(storedToken._id);

    const newAccessToken        = generateAccessToken(user);
    const newRawRefreshToken    = generateRefreshToken();
    const newHashedRefreshToken = hashToken(newRawRefreshToken);

    await RefreshToken.create({
      userId:    user._id,
      token:     newHashedRefreshToken,
      expiresAt: getRefreshTokenExpiry(),
      userAgent: req.headers['user-agent'] || '',
      ipAddress: req.ip || ''
    });

    return res.status(200).json({
      success: true,
      data: {
        accessToken:  newAccessToken,
        refreshToken: newRawRefreshToken
      }
    });
  } catch (err) {
    console.error('[POST /auth/refresh]', err);
    return res.status(500).json({ success: false, message: 'Server error during token refresh.' });
  }
});

// ========================================
// 3️⃣  POST /api/auth/logout
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
// 4️⃣  POST /api/auth/logout-all  (requires auth)
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
// 5️⃣  POST /api/auth/forgot-password
// ========================================
router.post('/forgot-password', async (req, res) => {
  try {
    const { error } = validateForgotPassword(req.body);
    if (error) return res.status(400).json({ success: false, message: error.details[0].message });

    const user = await User.findOne({ email: req.body.email });

    // Always return 200 to avoid email enumeration
    if (!user) return res.status(200).json({ success: true, message: 'If email exists, a reset link has been sent.' });

    const resetToken = user.generatePasswordResetToken();
    await user.save();

    const resetUrl = `${config.get('clientUrl')}/reset-password?token=${resetToken}`;

    await transporter.sendMail({
      from:    config.get('emailUser'),
      to:      user.email,
      subject: 'Password Reset Request — Flowio',
      html: `
        <h2>Password Reset</h2>
        <p>Hello ${user.name},</p>
        <p>Click below to reset your password:</p>
        <p><a href="${resetUrl}"><strong>Reset Password</strong></a></p>
        <p><strong>This link expires in 10 minutes.</strong></p>
      `
    });

    return res.status(200).json({ success: true, message: 'If email exists, a reset link has been sent.' });
  } catch (err) {
    console.error('[POST /auth/forgot-password]', err);
    return res.status(500).json({ success: false, message: 'Error: ' + err.message });
  }
});

// ========================================
// 6️⃣  POST /api/auth/reset-password
// ========================================
router.post('/reset-password', async (req, res) => {
  try {
    const { error } = validatePasswordReset(req.body);
    if (error) return res.status(400).json({ success: false, message: error.details[0].message });

    const { resetToken, newPassword } = req.body;

    const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');

    const user = await User.findOne({
      passwordResetToken:   hashedToken,
      passwordResetExpires: { $gt: Date.now() }
    });

    if (!user) return res.status(400).json({ success: false, message: 'Invalid or expired reset token.' });

    const salt = await bcrypt.genSalt(10);
    user.password             = await bcrypt.hash(newPassword, salt);
    user.passwordResetToken   = null;
    user.passwordResetExpires = null;
    await user.save();

    // Auto-login: issue fresh token pair after reset
    const accessToken        = generateAccessToken(user);
    const rawRefreshToken    = generateRefreshToken();
    const hashedRefreshToken = hashToken(rawRefreshToken);

    await RefreshToken.create({
      userId:    user._id,
      token:     hashedRefreshToken,
      expiresAt: getRefreshTokenExpiry(),
      userAgent: req.headers['user-agent'] || '',
      ipAddress: req.ip || ''
    });

    return res.status(200).json({
      success: true,
      message: 'Password reset successfully.',
      data: {
        accessToken,
        refreshToken: rawRefreshToken,
        user: {
          _id:   user._id,
          name:  user.name,
          email: user.email,
          role:  user.role
        }
      }
    });
  } catch (err) {
    console.error('[POST /auth/reset-password]', err);
    return res.status(500).json({ success: false, message: 'Error: ' + err.message });
  }
});

module.exports = router;