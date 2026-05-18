const jwt = require('jsonwebtoken');
const config = require('config');
const mongoose = require('mongoose');
const Joi = require('joi');

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
      required: true,
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
      enum: ['developer', 'designer', 'qa', 'none'],
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
    timestamps: true // ✅ handles createdAt and updatedAt automatically
  }
);

// ✅ Generate JWT with role included for authorization
userSchema.methods.generateAuthToken = function () {
  const token = jwt.sign(
    { _id: this._id, role: this.role },
    config.get('jwtPrivateKey')
  );
  return token;
};

// ✅ Generate password reset token
userSchema.methods.generatePasswordResetToken = function () {
  const crypto = require('crypto');
  const resetToken = crypto.randomBytes(32).toString('hex');
  
  // Hash the token before storing
  this.passwordResetToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');
  
  // Token expires in 10 minutes
  this.passwordResetExpires = Date.now() + 10 * 60 * 1000;
  
  return resetToken; // Return the un-hashed token to send in email
};

const User = mongoose.model('User', userSchema);

function validateUser(user) {
  const schema = Joi.object({
    name: Joi.string().min(3).max(50).required(),
    email: Joi.string().min(5).max(255).required().email(),
    password: Joi.string().min(6).max(255).required(),
    role: Joi.string().valid('system-admin', 'project-manager', 'founder', 'team-member'),
    specialization: Joi.string().valid('developer', 'designer', 'qa', 'none'),
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

module.exports.User = User;
module.exports.validate = validateUser;
module.exports.validateForgotPassword = validateForgotPassword;
module.exports.validatePasswordReset = validatePasswordReset;
