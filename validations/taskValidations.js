const Joi = require('joi');

/**
 * Validates the request body for moving a task (changing column and status)
 * Both columnId and status are required for atomic updates
 */
const validateMoveTask = (data) => {
  const schema = Joi.object({
    columnId: Joi.string()
      .pattern(/^[0-9a-fA-F]{24}$/, 'ObjectId')
      .required()
      .messages({
        'string.pattern.name': 'columnId must be a valid MongoDB ObjectId.',
        'any.required': 'columnId is required.',
      }),
    status: Joi.string()
      .valid('To Do', 'In Progress', 'In Review', 'Done')
      .required()
      .messages({
        'any.required': 'status is required.',
        'string.valid': 'status must be one of: To Do, In Progress, In Review, Done',
      }),
  });

  return schema.validate(data, { abortEarly: false });
};

/**
 * Validates the request body for updating a task (general updates)
 * Allows partial updates to title, description, priority, due_date, assignee, columnId, status
 */
const validateUpdateTask = (data) => {
  const schema = Joi.object({
    title: Joi.string()
      .trim()
      .optional()
      .messages({
        'string.empty': 'Task title cannot be empty.',
      }),
    description: Joi.string()
      .trim()
      .optional()
      .allow(''),
    status: Joi.string()
      .valid('To Do', 'In Progress', 'In Review', 'Done')
      .optional()
      .messages({
        'string.valid': 'status must be one of: To Do, In Progress, In Review, Done',
      }),
    priority: Joi.string()
      .valid('Low', 'Medium', 'High', 'Urgent')
      .optional()
      .messages({
        'string.valid': 'priority must be one of: Low, Medium, High, Urgent',
      }),
    due_date: Joi.date()
      .iso()
      .optional()
      .messages({
        'date.format': 'due_date must be a valid ISO 8601 date string.',
      }),
    assignee: Joi.string()
      .pattern(/^[0-9a-fA-F]{24}$/, 'ObjectId')
      .optional()
      .messages({
        'string.pattern.name': 'assignee must be a valid MongoDB ObjectId.',
      }),
    columnId: Joi.string()
      .pattern(/^[0-9a-fA-F]{24}$/, 'ObjectId')
      .optional()
      .messages({
        'string.pattern.name': 'columnId must be a valid MongoDB ObjectId.',
      }),
  });

  return schema.validate(data, { abortEarly: false });
};

module.exports = { validateMoveTask, validateUpdateTask };
