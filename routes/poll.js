import express from 'express';
import pollController from './polls/poll.controller.js';

const router = express.Router();

// create poll
router.post(
  "/",
  pollController.createPoll
);

// get all polls
router.get("/", pollController.getAllPolls);

// vote
router.post(
  "/vote",
  pollController.votePoll
);

// results
router.get("/results/:id", pollController.getResults);

export default router;