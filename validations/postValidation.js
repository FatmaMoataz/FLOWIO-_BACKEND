const Joi = require("joi");

const createPostSchema = Joi.object({
  content: Joi.string().min(1).max(300).required(),

  is_pinned: Joi.boolean(),

  communityId: Joi.string()
    .pattern(/^[0-9a-fA-F]{24}$/)
    .required(),

  pollId: Joi.string()
    .pattern(/^[0-9a-fA-F]{24}$/)
    .optional()
});

const updatePostSchema = Joi.object({
  content: Joi.string().min(1).max(300),

  is_pinned: Joi.boolean(),

  communityId: Joi.string().pattern(/^[0-9a-fA-F]{24}$/),

  pollId: Joi.string().pattern(/^[0-9a-fA-F]{24}$/)
}).min(1);

const idParamSchema = Joi.object({
  id: Joi.string()
    .pattern(/^[0-9a-fA-F]{24}$/)
    .required()
});

const commentSchema = Joi.object({
  content: Joi.string().min(1).max(200).required()
});

module.exports = {
  createPostSchema,
  updatePostSchema,
  idParamSchema,
  commentSchema
};