const Joi = require("joi");

const createPollSchema = Joi.object({
  question: Joi.string().min(1).required(),

  communityId: Joi.string()
    .pattern(/^[0-9a-fA-F]{24}$/)
    .optional(),

  postId: Joi.string()
    .pattern(/^[0-9a-fA-F]{24}$/)
    .optional(),

  userId: Joi.string()
    .pattern(/^[0-9a-fA-F]{24}$/)
    .optional(),

  options: Joi.array().items(
    Joi.object({
      text: Joi.string().min(1).required()
    })
  ).min(1).required()
});

const votePollSchema = Joi.object({
  pollId: Joi.string()
    .pattern(/^[0-9a-fA-F]{24}$/)
    .required(),

  optionText: Joi.string().min(1).required(),

  userId: Joi.string()
    .pattern(/^[0-9a-fA-F]{24}$/)
    .required()
});

const idParamSchema = Joi.object({
  id: Joi.string()
    .pattern(/^[0-9a-fA-F]{24}$/)
    .required()
});

module.exports = {
  createPollSchema,
  votePollSchema,
  idParamSchema
};