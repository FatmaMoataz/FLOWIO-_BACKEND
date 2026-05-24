import mongoose from 'mongoose';

const pollVoteSchema = new mongoose.Schema(
  {
    pollId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Poll",
      required: true,
    },

    optionText: {
      type: String,
      required: true,
    },

    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true }
);

// prevent duplicate vote
pollVoteSchema.index({ pollId: 1, userId: 1 }, { unique: true });

const PollVote = mongoose.model('PollVote', pollVoteSchema);

export default PollVote;