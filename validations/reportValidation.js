const Joi = require('joi');

const OBJECT_ID = Joi.string().hex().length(24);
const allowedReportTypes = ['bug', 'feature', 'task', 'other'];

const createReportSchema = Joi.object({
  title: Joi.string().min(2).max(50).required(),
  content: Joi.string().min(10).max(1000).required(),
  type: Joi.string().valid(...allowedReportTypes).required(),
  projectId: OBJECT_ID.optional(),
  userId: OBJECT_ID.optional()
});

const updateReportSchema = Joi.object({
  title: Joi.string().min(2).max(50),
  content: Joi.string().min(10).max(1000),
  type: Joi.string().valid(...allowedReportTypes),
  projectId: OBJECT_ID.optional(),
  userId: OBJECT_ID.optional()
}).min(1);

const idParamSchema = Joi.object({
  id: OBJECT_ID.required()
});

module.exports = {
  createReportSchema,
  updateReportSchema,
  idParamSchema,
  allowedReportTypes
};
