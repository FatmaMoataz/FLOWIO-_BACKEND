import express from 'express';
import notificationController from './notifications/notification.controller.js';

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

export default router;