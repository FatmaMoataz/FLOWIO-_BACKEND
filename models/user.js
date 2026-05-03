const jwt = require('jsonwebtoken'); //
const config = require('config'); //
const mongoose = require('mongoose');
const Joi = require('joi'); // Important for Request Validation

const userSchema = new mongoose.Schema({
  name: { type: String, required: true, minlength: 3, maxlength: 50, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true, minlength: 6, maxlength: 1024 },
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
  createdAt: { type: Date, default: Date.now },
  companyId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Company' // ربط اليوزر بشركة معينة
  }
});
// جوه ملف models/user.js
userSchema.methods.generateAuthToken = function() {
  const token = jwt.sign({ _id: this._id }, config.get('jwtPrivateKey'));
  return token;
};

const User = mongoose.model('User', userSchema);

// This function will be used in your routes/users.js to check input
function validateUser(user) {
  const schema = Joi.object({
    name: Joi.string().min(3).max(50).required(),
    email: Joi.string().min(5).max(255).required().email(),
    password: Joi.string().min(6).max(255).required(),
    role: Joi.string().valid('system-admin', 'project-manager', 'founder', 'team-member'),
    specialization: Joi.string().valid('developer', 'designer', 'qa', 'none')
  });

  return schema.validate(user);
}

module.exports.User = User;
module.exports.validate = validateUser;