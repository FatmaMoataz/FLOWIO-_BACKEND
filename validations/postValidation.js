const Joi = require("joi");

const createPostSchema = Joi.object({
  content: Joi.string().min(1).max(300).required(),

  is_pinned: Joi.boolean(),

  communityId: Joi.string()
    .pattern(/^[0-9a-fA-F]{24}$/)
    .optional(),

  userId: Joi.string()
    .pattern(/^[0-9a-fA-F]{24}$/)
    .optional(),

  pollId: Joi.string()
    .pattern(/^[0-9a-fA-F]{24}$/)
    .optional()
});

const updatePostSchema = Joi.object({
  content: Joi.string().min(1).max(300),

  is_pinned: Joi.boolean(),

  communityId: Joi.string()
    .pattern(/^[0-9a-fA-F]{24}$/)
    .optional(),

  userId: Joi.string()
    .pattern(/^[0-9a-fA-F]{24}$/)
    .optional(),

  pollId: Joi.string()
    .pattern(/^[0-9a-fA-F]{24}$/)
    .optional()
});

const idParamSchema = Joi.object({
  id: Joi.string()
    .pattern(/^[0-9a-fA-F]{24}$/)
    .required()
});

module.exports = {
  createPostSchema,
  updatePostSchema,
  idParamSchema
};