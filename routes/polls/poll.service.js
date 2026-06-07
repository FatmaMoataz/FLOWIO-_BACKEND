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
  const poll = await Poll.findById(pollId);
  if (!poll) throw new Error("Poll not found");

  const votes = await PollVote.find({ pollId });
  const totalVotes = votes.length;

  // تحضير الخيارات وعداداتها
  const results = {};
  poll.options.forEach(opt => {
    results[opt.text] = 0;
  });

  // حساب الأصوات الحقيقية
  votes.forEach((v) => {
    if (results[v.optionText] !== undefined) {
      results[v.optionText]++;
    }
  });

  return {
    success: true,
    data: {
      question: poll.question,
      totalVotes,
      breakdown: results // هيرجع كائن فيه: { "Option A": 5, "Option B": 2 }
    },
  };
};

// كائن default موحد لتسهيل الاستدعاء في الـ Controller
export default {
  createPollService,
  getAllPollsService,
  votePollService,
  getPollResultsService
};