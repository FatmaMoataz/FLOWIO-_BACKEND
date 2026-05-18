import Joi from 'joi';

const createPostSchema = Joi.object({
  content: Joi.string().min(1).max(300).required(),

  is_pinned: Joi.boolean(),

  communityId: Joi.string()
    .pattern(/^[0-9a-fA-F]{24}$/)
    .optional(),

  pollId: Joi.string()
    .pattern(/^[0-9a-fA-F]{24}$/)
    .optional(),

  // 👈 زودي ده هنا عشان الـ Joi يعدي الـ request بسلام
  pollData: Joi.object({
    question: Joi.string().min(1).required(),
    options: Joi.array().items(
      Joi.object({
        text: Joi.string().min(1).required()
      })
    ).min(2).required()
  }).optional() 
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

export {
  createPostSchema,
  updatePostSchema,
  idParamSchema,
  commentSchema
};