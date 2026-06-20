import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import Joi from 'joi';
import crypto from 'crypto';

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      minlength: 3,
      maxlength: 50,
      trim: true
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true
    },
    password: {
      type: String,
      // اختيارية لدعم حسابات Google Sign-In التي لا تمتلك كلمة مرور محلية
      required: function() { return !this.googleId; },
      minlength: 6,
      maxlength: 1024
    },
    role: {
      type: String,
      required: true,
      enum: ['system-admin', 'project-manager', 'founder', 'team-member'],
      default: 'team-member'
    },
    specialization: {
      type: String,
      enum: ['developer', 'designer', 'qa', 'none', 'Employee'],
      default: 'none'
    },
    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Company',
      default: null
    },
    // مخزن مُشفّر (hash) لكود الـ OTP المكون من 6 أرقام، وليس الكود نفسه
    passwordResetOTP: {
      type: String,
      default: null
    },
    passwordResetExpires: {
      type: Date,
      default: null
    },
    avatar: {
      type: String,
      default: null,
      trim: true,
    },
  },
  {
    timestamps: true
  }
);

// توليد الـ Access Token
userSchema.methods.generateAuthToken = function () {
  const token = jwt.sign(
    {
      _id: this._id,
      role: this.role,
      companyId: this.companyId
    },
    process.env.JWT_PRIVATE_KEY,
    { expiresIn: '15m' }
  );
  return token;
};

// توليد كود OTP من 6 أرقام لاستعادة كلمة المرور
// بنرجع الكود الصريح عشان نبعته بالإيميل، وبنخزن نسخة مُشفّرة فقط في الداتابيز
userSchema.methods.generatePasswordResetOTP = function () {
  const otp = Math.floor(100000 + Math.random() * 900000).toString();

  this.passwordResetOTP = crypto
    .createHash('sha256')
    .update(otp)
    .digest('hex');

  this.passwordResetExpires = Date.now() + 10 * 60 * 1000; // 10 دقائق

  return otp;
};

const User = mongoose.model('User', userSchema);

// الـ Validation الخاص بإنشاء مستخدم أو تحديثه كاملاً
function validateUser(user) {
  const schema = Joi.object({
    name: Joi.string().min(3).max(50).required(),
    email: Joi.string().min(5).max(255).required().email(),
    password: Joi.string().min(6).max(255).required(),
    role: Joi.string().valid('system-admin', 'project-manager', 'founder', 'team-member'),
    specialization: Joi.string().valid('developer', 'designer', 'qa', 'none', 'Employee'),
    companyId: Joi.string().hex().length(24).optional().allow(null)
  });

  return schema.validate(user);
}

function validateForgotPassword(req) {
  const schema = Joi.object({
    email: Joi.string().min(5).max(255).required().email()
  });
  return schema.validate(req);
}

// تحقق من الـ OTP بدون تغيير كلمة المرور (للخطوة 2 في الفرونت إند)
function validateVerifyOtp(req) {
  const schema = Joi.object({
    email: Joi.string().min(5).max(255).required().email(),
    otp: Joi.string().length(6).pattern(/^[0-9]+$/).required().messages({
      'string.pattern.base': 'OTP must be a 6-digit number.',
      'string.length': 'OTP must be exactly 6 digits.'
    })
  });
  return schema.validate(req);
}

function validatePasswordReset(req) {
  const schema = Joi.object({
    email: Joi.string().min(5).max(255).required().email(),
    otp: Joi.string().length(6).pattern(/^[0-9]+$/).required().messages({
      'string.pattern.base': 'OTP must be a 6-digit number.',
      'string.length': 'OTP must be exactly 6 digits.'
    }),
    newPassword: Joi.string().min(6).max(255).required()
  });
  return schema.validate(req);
}

export { User };
export { validateUser as validate };
export { validateForgotPassword };
export { validateVerifyOtp };
export { validatePasswordReset };