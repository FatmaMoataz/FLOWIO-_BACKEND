const Joi = require('joi');

// ── Epic Validation ────────────────────────────────────────────────────────────

/**
 * Validates the request body for creating an Epic.
 * Note: `companyId` is required and must be a valid Mongo ObjectId string.
 */
const validateCreateEpic = (data) => {
  const schema = Joi.object({
    name: Joi.string().trim().required().messages({
      'string.empty': 'Epic name cannot be empty.',
      'any.required': 'Epic name is required.',
    }),
    description: Joi.string().trim().optional().allow(''),
    status: Joi.string()
      .valid('To Do', 'In Progress', 'Done')
      .default('To Do')
      .optional(),
    companyId: Joi.string()
      .pattern(/^[0-9a-fA-F]{24}$/, 'ObjectId')
      .required()
      .messages({
        'string.pattern.name': 'companyId must be a valid MongoDB ObjectId.',
        'any.required': 'companyId is required.',
      }),
  });

  return schema.validate(data, { abortEarly: false });
};

// ── Task Validation ────────────────────────────────────────────────────────────

/**
 * Validates the request body for creating a Task.
 * Note: `creator` is intentionally excluded — it is injected from req.user._id
 * in the route handler and should never come from the client.
 */
const validateCreateTask = (data) => {
  const schema = Joi.object({
    title: Joi.string().trim().required().messages({
      'string.empty': 'Task title cannot be empty.',
      'any.required': 'Task title is required.',
    }),
    description: Joi.string().trim().optional().allow(''),
    status: Joi.string()
      .valid('To Do', 'In Progress', 'In Review', 'Done')
      .default('To Do')
      .optional(),
    priority: Joi.string()
      .valid('Low', 'Medium', 'High', 'Urgent')
      .optional(),
    due_date: Joi.date().iso().optional().messages({
      'date.format': 'due_date must be a valid ISO 8601 date string.',
    }),
    assignee: Joi.string()
      .pattern(/^[0-9a-fA-F]{24}$/, 'ObjectId')
      .optional()
      .messages({
        'string.pattern.name': 'assignee must be a valid MongoDB ObjectId.',
      }),
    epicId: Joi.string()
      .pattern(/^[0-9a-fA-F]{24}$/, 'ObjectId')
      .required()
      .messages({
        'string.pattern.name': 'epicId must be a valid MongoDB ObjectId.',
        'any.required': 'epicId is required.',
      }),
    columnId: Joi.string()
      .pattern(/^[0-9a-fA-F]{24}$/, 'ObjectId')
      .optional()
      .messages({
        'string.pattern.name': 'columnId must be a valid MongoDB ObjectId.',
      }),

      // --- هنا الـ companyId إجباري عند الكرنية ---
    companyId: Joi.string()
      .pattern(/^[0-9a-fA-F]{24}$/, 'ObjectId')
      .required() 
      .messages({
        'string.pattern.name': 'companyId must be a valid MongoDB ObjectId.',
        'any.required': 'companyId is required to create a task.',
      }),
  });

  return schema.validate(data, { abortEarly: false });
};

module.exports = { validateCreateEpic, validateCreateTask };