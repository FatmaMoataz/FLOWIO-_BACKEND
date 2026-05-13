const express = require("express");
const notificationController = require("./notifications/notification.controller");

const router = express.Router();

// CREATE NOTIFICATION
router.post(
  "/",
  notificationController.createNotification
);

// GET USER NOTIFICATIONS
router.get(
  "/user/:userId",
  notificationController.getUserNotifications
);

// MARK AS READ
router.patch(
  "/read/:id",
  notificationController.markAsRead
);

// DELETE
router.delete(
  "/:id",
  notificationController.deleteNotification
);

module.exports = router;