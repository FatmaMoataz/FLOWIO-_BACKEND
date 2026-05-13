const notificationService = require("./notification.service");
const Joi = require("joi");

const {
  createNotificationSchema,
  markAsReadSchema,
  userIdParamSchema,
  idParamSchema
} = require("../../validations/notificationValidation");

const objectId = Joi.string().hex().length(24);

// CREATE
const createNotification = async (req, res, next) => {
  const { error } = createNotificationSchema.validate(req.body);
  if (error) return res.status(400).json({ success: false, message: error.details[0].message });

  try {
    const result = await notificationService.createNotificationService(req.body);
    res.status(201).json(result);
  } catch (err) {
    next(err);
  }
};

// GET USER NOTIFICATIONS
const getUserNotifications = async (req, res, next) => {
  const { error } = userIdParamSchema.validate({ userId: req.params.userId });
  if (error) return res.status(400).json({ success: false, message: error.details[0].message });

  try {
    const result = await notificationService.getUserNotificationsService(
      req.params.userId
    );

    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
};

// MARK AS READ
const markAsRead = async (req, res, next) => {
  const { error } = idParamSchema.validate({ id: req.params.id });
  if (error) return res.status(400).json({ success: false, message: error.details[0].message });

  try {
    const result = await notificationService.markAsReadService(req.params.id);

    if (!result.success) {
      return res.status(404).json(result);
    }

    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
};

// DELETE
const deleteNotification = async (req, res, next) => {
  const { error } = idParamSchema.validate({ id: req.params.id });
  if (error) return res.status(400).json({ success: false, message: error.details[0].message });

  try {
    const result = await notificationService.deleteNotificationService(
      req.params.id
    );

    if (!result.success) {
      return res.status(404).json(result);
    }

    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
};

module.exports = {
  createNotification,
  getUserNotifications,
  markAsRead,
  deleteNotification
};