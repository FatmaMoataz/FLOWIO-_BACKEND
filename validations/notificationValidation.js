const Joi = require("joi");

const objectId = Joi.string().hex().length(24);

const createNotificationSchema = Joi.object({
  title: Joi.string().min(3).max(50).required(),

  message: Joi.string().min(10).max(200).required(),

  type: Joi.string()
    .valid(
      "SYSTEM",
      "TASK_ASSIGNED",
      "TASK_UPDATED",
      "COMMENT",
      "LIKE",
      "MENTION",
      "POLLS"
    )
    .required(),

  userId: objectId.required(),

  fromUserId: objectId.optional(),

  referenceId: objectId.optional(),

  referenceModel: Joi.string().valid("Task", "Post", "Poll").optional(),
});

const markAsReadSchema = Joi.object({
  id: objectId.required(),
});

const idParamSchema = Joi.object({
  id: objectId.required(),
});

const userIdParamSchema = Joi.object({
  userId: objectId.required(),
});

module.exports = {
  createNotificationSchema,
  markAsReadSchema,
  idParamSchema,
  userIdParamSchema
};