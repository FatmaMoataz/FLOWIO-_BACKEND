const Poll = require("../../models/poll");
const PollVote = require("../../models/pollVote");

// CREATE POLL
const createPollService = async (data) => {
  const poll = await Poll.create(data);

  return {
    success: true,
    message: "Poll created successfully",
    data: poll,
  };
};

// GET ALL POLLS
const getAllPollsService = async () => {
  const polls = await Poll.find()
    .populate("userId")
    .populate("postId")
    .populate("communityId");

  return {
    success: true,
    results: polls.length,
    data: polls,
  };
};

// VOTE
const votePollService = async (data = {}) => {
  if (!data || typeof data !== "object") {
    throw new Error("Vote payload is missing or invalid");
  }

  const { pollId, optionText, userId } = data;

  const vote = await PollVote.create({
    pollId,
    optionText,
    userId,
  });

  return {
    success: true,
    message: "Vote added successfully",
    data: vote,
  };
};

// GET RESULTS
const getPollResultsService = async (pollId) => {
  const votes = await PollVote.find({ pollId });

  const result = {};

  votes.forEach((v) => {
    result[v.optionText] = (result[v.optionText] || 0) + 1;
  });

  return {
    success: true,
    data: result,
  };
};

module.exports = {
  createPollService,
  getAllPollsService,
  votePollService,
  getPollResultsService
};