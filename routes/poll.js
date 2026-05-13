const express = require("express");
const pollController = require("./polls/poll.controller");

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

module.exports = router;