const mongoose = require("mongoose");

const postSchema = new mongoose.Schema(
  {
    content: {
      type: String,
      required: true,
      minLength: [1, "Post content must be at least 1 character long"],
      maxLength: [300, "Post content cannot exceed 300 characters"],
    },

    is_pinned: {
      type: Boolean,
      default: false,
    },

    communityId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Community",
    },

    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },

    pollId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Poll",
    },
  },
  {
    timestamps: true,
    toObject: { virtuals: true },
    toJSON: { virtuals: true },
  }
);

const Post = mongoose.model("Post", postSchema);

module.exports = Post;