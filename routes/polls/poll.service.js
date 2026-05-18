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

// ── HELPER: build a fully enriched poll for a given user ───────────────────────
const buildEnrichedPoll = async (poll, userId) => {
  const allVotes = await PollVote.find({ pollId: poll._id });
  const totalVotes = allVotes.length;
  const myVote = userId
    ? allVotes.find((v) => String(v.userId) === String(userId))
    : null;

  const optionsWithCounts = poll.options.map((option) => {
    const voteCount = allVotes.filter((v) => v.optionText === option.text).length;
    const percentage = totalVotes > 0 ? Math.round((voteCount / totalVotes) * 100) : 0;
    const votedByMe = myVote ? myVote.optionText === option.text : false;

    return {
      _id: option._id,
      text: option.text,
      voteCount,
      percentage,
      votedByMe,
    };
  });

  return {
    _id: poll._id,
    question: poll.question,
    options: optionsWithCounts,
    totalVotes,
    myVotedOption: myVote ? myVote.optionText : null,
    createdAt: poll.createdAt,
  };
};

// ── GET ALL POLLS WITH VOTE COUNTS ──────────────────────────────────────────────
export const getAllPollsService = async (userId) => {
  const polls = await Poll.find()
    .populate("userId")
    .populate("postId")
    .populate("communityId");

  const enrichedPolls = await Promise.all(
    polls.map((poll) => buildEnrichedPoll(poll, userId))
  );

  return {
    success: true,
    results: enrichedPolls.length,
    data: enrichedPolls,
  };
};

// ── VOTE / CHANGE VOTE / REMOVE VOTE ────────────────────────────────────────────
export const votePollService = async (data = {}) => {
  if (!data || typeof data !== "object") {
    throw new Error("Vote payload is missing or invalid");
  }

  const { pollId, optionText, userId } = data;

  const poll = await Poll.findById(pollId);
  if (!poll) throw new Error("Poll not found");

  const validOption = poll.options.some((opt) => opt.text === optionText);
  if (!validOption) throw new Error("Invalid poll option");

  const existingVote = await PollVote.findOne({ pollId, userId });

  let action;
  if (existingVote && existingVote.optionText === optionText) {
    // Clicked same option again → remove (toggle off)
    await PollVote.deleteOne({ _id: existingVote._id });
    action = "removed";
  } else if (existingVote) {
    // Clicked a different option → change vote
    existingVote.optionText = optionText;
    await existingVote.save();
    action = "changed";
  } else {
    // No previous vote → create
    await PollVote.create({ pollId, optionText, userId });
    action = "added";
  }

  const updatedPoll = await buildEnrichedPoll(poll, userId);

  const messages = {
    added: "Vote added successfully",
    changed: "Vote updated successfully",
    removed: "Vote removed successfully",
  };

  return {
    success: true,
    action,
    message: messages[action],
    data: updatedPoll,
  };
};

// ── GET RESULTS (single poll) ────────────────────────────────────────────────
export const getPollResultsService = async (pollId, userId) => {
  const poll = await Poll.findById(pollId);
  if (!poll) throw new Error("Poll not found");

  const enrichedPoll = await buildEnrichedPoll(poll, userId);

  return {
    success: true,
    data: enrichedPoll,
  };
};

export default {
  createPollService,
  getAllPollsService,
  votePollService,
  getPollResultsService,
};