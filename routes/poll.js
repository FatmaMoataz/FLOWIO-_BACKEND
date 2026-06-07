import express from 'express';
import * as pollController from './polls/poll.controller.js';
import auth from '../middleware/auth.js';

const router = express.Router();

// create poll
router.post(
  "/",
  auth, // تأكد إن المستخدم مسجل دخوله عشان يقدر يعمل تصويت 🛡️
  pollController.createPoll
);

// get all polls
router.get("/", auth, pollController.getAllPolls);

// vote
router.post(
  "/vote",
  auth, // تأكد إن المستخدم مسجل دخوله عشان يقدر يعمل تصويت 🛡️
  pollController.votePoll
);

// results
router.get("/results/:id", auth, pollController.getResults);

export default router;