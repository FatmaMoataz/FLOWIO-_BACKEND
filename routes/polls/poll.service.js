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


// ── GET ALL POLLS WITH VOTE COUNTS ──────────────────────────────────────────────
export const getAllPollsService = async () => {
  const polls = await Poll.find()
    .populate("userId")
    .populate("postId")
    .populate("communityId");

  // Get all votes for all polls
  const pollIds = polls.map(p => p._id);
  const allVotes = await PollVote.find({ 
    pollId: { $in: pollIds } 
  });

  // Enrich each poll with vote counts
  const enrichedPolls = polls.map(poll => {
    const pollVotes = allVotes.filter(v => 
      v.pollId.toString() === poll._id.toString()
    );
    
    const totalVotes = pollVotes.length;
    
    // Calculate vote counts for each option
    const optionsWithCounts = poll.options.map(option => {
      const voteCount = pollVotes.filter(v => v.optionText === option.text).length;
      const percentage = totalVotes > 0 
        ? Math.round((voteCount / totalVotes) * 100) 
        : 0;
      
      return {
        _id: option._id,
        text: option.text,
        voteCount: voteCount,
        percentage: percentage,
        // Note: votes array not included for performance, but you can add if needed
      };
    });

    return {
      ...poll.toObject(),
      options: optionsWithCounts,
      totalVotes: totalVotes,
    };
  });

  return {
    success: true,
    results: enrichedPolls.length,
    data: enrichedPolls,
  };
};

// ── VOTE ───────────────────────────────────────────────────────────────────────
export const votePollService = async (data = {}) => {
  if (!data || typeof data !== "object") {
    throw new Error("Vote payload is missing or invalid");
  }

  const { pollId, optionText, userId } = data;

  // Check if user already voted
  const existingVote = await PollVote.findOne({ pollId, userId });
  if (existingVote) {
    throw new Error("You have already voted in this poll!");
  }

  // Create the vote
  await PollVote.create({
    pollId,
    optionText,
    userId,
  });

  // Get the poll with updated vote counts
  const poll = await Poll.findById(pollId);
  if (!poll) throw new Error("Poll not found");

  // Get all votes for this poll
  const allVotes = await PollVote.find({ pollId });
  const totalVotes = allVotes.length;

  // Calculate vote counts for each option
  const optionsWithCounts = poll.options.map(option => {
    const voteCount = allVotes.filter(v => v.optionText === option.text).length;
    const percentage = totalVotes > 0 ? Math.round((voteCount / totalVotes) * 100) : 0;
    const votedByMe = option.text === optionText;
    
    return {
      _id: option._id,
      text: option.text,
      voteCount: voteCount,
      percentage: percentage,
      votedByMe: votedByMe
    };
  });

  // Return the complete updated poll
  const updatedPoll = {
    _id: poll._id,
    question: poll.question,
    options: optionsWithCounts,
    totalVotes: totalVotes,
    createdAt: poll.createdAt
  };

  return {
    success: true,
    message: "Vote added successfully",
    data: updatedPoll
  };
};

// ── GET RESULTS (single poll) ────────────────────────────────────────────────
export const getPollResultsService = async (pollId) => {
  const poll = await Poll.findById(pollId);
  if (!poll) throw new Error("Poll not found");

  const votes = await PollVote.find({ pollId });
  const totalVotes = votes.length;

  const results = {};
  poll.options.forEach(opt => {
    results[opt.text] = 0;
  });

  votes.forEach((v) => {
    if (results[v.optionText] !== undefined) {
      results[v.optionText]++;
    }
  });

  // Calculate percentages
  const optionsWithPercentages = poll.options.map(option => ({
    text: option.text,
    voteCount: results[option.text] || 0,
    percentage: totalVotes > 0 
      ? Math.round(((results[option.text] || 0) / totalVotes) * 100)
      : 0
  }));

  return {
    success: true,
    data: {
      question: poll.question,
      totalVotes,
      options: optionsWithPercentages,
      breakdown: results
    },
  };
};



// ── GET ALL POLLS ──────────────────────────────────────────────────────────────
// export const getAllPollsService = async () => {
//   const polls = await Poll.find()
//     .populate("userId")
//     .populate("postId")
//     .populate("communityId");

//   return {
//     success: true,
//     results: polls.length,
//     data: polls,
//   };
// };

// ── VOTE ───────────────────────────────────────────────────────────────────────
// export const votePollService = async (data = {}) => {
//   if (!data || typeof data !== "object") {
//     throw new Error("Vote payload is missing or invalid");
//   }

//   const { pollId, optionText, userId } = data;

//   // Check if user already voted
//   const existingVote = await PollVote.findOne({ pollId, userId });
//   if (existingVote) {
//     throw new Error("You have already voted in this poll!");
//   }

//   // Create the vote
//   const vote = await PollVote.create({
//     pollId,
//     optionText,
//     userId,
//   });

//   // Get the poll with populated vote counts
//   const poll = await Poll.findById(pollId);
//   if (!poll) throw new Error("Poll not found");

//   // Get all votes for this poll
//   const allVotes = await PollVote.find({ pollId });
//   const totalVotes = allVotes.length;

//   // Calculate vote counts for each option
//   const optionsWithCounts = poll.options.map(option => {
//     const voteCount = allVotes.filter(v => v.optionText === option.text).length;
//     const percentage = totalVotes > 0 ? Math.round((voteCount / totalVotes) * 100) : 0;
//     const votedByMe = option.text === optionText; // Current user voted for this option
    
//     return {
//       _id: option._id,
//       text: option.text,
//       voteCount: voteCount,
//       votes: allVotes.filter(v => v.optionText === option.text).map(v => v.userId),
//       percentage: percentage,
//       votedByMe: votedByMe
//     };
//   });

//   // Return the complete updated poll
//   const updatedPoll = {
//     _id: poll._id,
//     question: poll.question,
//     options: optionsWithCounts,
//     totalVotes: totalVotes,
//     createdAt: poll.createdAt
//   };

//   return {
//     success: true,
//     message: "Vote added successfully",
//     data: updatedPoll // ✅ Return the poll with updated counts
//   };
// };

// ── GET RESULTS ────────────────────────────────────────────────────────────────
// export const getPollResultsService = async (pollId) => {
//   const poll = await Poll.findById(pollId);
//   if (!poll) throw new Error("Poll not found");

//   const votes = await PollVote.find({ pollId });
//   const totalVotes = votes.length;

//   // تحضير الخيارات وعداداتها
//   const results = {};
//   poll.options.forEach(opt => {
//     results[opt.text] = 0;
//   });

//   // حساب الأصوات الحقيقية
//   votes.forEach((v) => {
//     if (results[v.optionText] !== undefined) {
//       results[v.optionText]++;
//     }
//   });

//   return {
//     success: true,
//     data: {
//       question: poll.question,
//       totalVotes,
//       breakdown: results // هيرجع كائن فيه: { "Option A": 5, "Option B": 2 }
//     },
//   };
// };

// كائن default موحد لتسهيل الاستدعاء في الـ Controller
export default {
  createPollService,
  getAllPollsService,
  votePollService,
  getPollResultsService
};