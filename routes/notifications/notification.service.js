const Notification = require("../../models/notification");

// CREATE NOTIFICATION
const createNotificationService = async (data) => {
  const notification = await Notification.create(data);

  return {
    success: true,
    message: "Notification created successfully",
    data: notification,
  };
};

// GET USER NOTIFICATIONS
const getUserNotificationsService = async (userId) => {
  const notifications = await Notification.find({ userId })
    .sort({ createdAt: -1 })
    .populate("userId fromUserId");

  return {
    success: true,
    results: notifications.length,
    data: notifications,
  };
};

// MARK AS READ
const markAsReadService = async (id) => {
  const notification = await Notification.findById(id);

  if (!notification) {
    return {
      success: false,
      message: "Notification not found",
    };
  }

  notification.is_read = true;
  notification.read_at = new Date();

  await notification.save();

  return {
    success: true,
    message: "Notification marked as read",
    data: notification,
  };
};

// DELETE NOTIFICATION
const deleteNotificationService = async (id) => {
  const notification = await Notification.findByIdAndDelete(id);

  if (!notification) {
    return {
      success: false,
      message: "Notification not found",
    };
  }

  return {
    success: true,
    message: "Notification deleted successfully",
  };
};

module.exports = {
  createNotificationService,
  getUserNotificationsService,
  markAsReadService,
  deleteNotificationService
};