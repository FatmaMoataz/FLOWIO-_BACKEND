// إضافة امتداد .js للموديلات المحلية إجباري
import Poll from "../../models/poll.js";
import PollVote from "../../models/pollVote.js";

// ── CREATE POLL ────────────────────────────────────────────────────────────────
export const createPollService = async (data) => {
  const poll = await Poll.create(data);

  return {
    success: true,
    message: "Poll created successfully",
    data: poll,
  };
};

// ── GET ALL POLLS ──────────────────────────────────────────────────────────────
export const getAllPollsService = async () => {
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

// ── VOTE ───────────────────────────────────────────────────────────────────────
export const votePollService = async (data = {}) => {
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

// ── GET RESULTS ────────────────────────────────────────────────────────────────
export const getPollResultsService = async (pollId) => {
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

// كائن default موحد لتسهيل الاستدعاء في الـ Controller
export default {
  createPollService,
  getAllPollsService,
  votePollService,
  getPollResultsService
};