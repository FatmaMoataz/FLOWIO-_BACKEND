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
      // تم جعلها اختيارية لدعم حسابات Google Sign-In التي لا تمتلك كلمة مرور محلية
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
    passwordResetToken: {
      type: String,
      default: null
    },
    passwordResetExpires: {
      type: Date,
      default: null
    }
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
    { expiresIn: '15m' } // مدة قصيرة للأمان طالما يوجد Refresh Token
  );
  return token;
};

// توليد توكن استعادة كلمة المرور
userSchema.methods.generatePasswordResetToken = function () {
  const resetToken = crypto.randomBytes(32).toString('hex');
  
  this.passwordResetToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');
  
  this.passwordResetExpires = Date.now() + 10 * 60 * 1000; // 10 دقائق
  
  return resetToken;
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

function validatePasswordReset(req) {
  const schema = Joi.object({
    resetToken: Joi.string().required(),
    newPassword: Joi.string().min(6).max(255).required()
  });
  return schema.validate(req);
}

export { User };
export { validateUser as validate };
export { validateForgotPassword };
export { validatePasswordReset };