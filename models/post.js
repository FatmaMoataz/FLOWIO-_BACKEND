import mongoose from 'mongoose';

const postSchema = new mongoose.Schema(
  {
    content: {
      type: String,
      required: true,
      minLength: [1, "Post content must be at least 1 character long"],
      maxLength: [300, "Post content cannot exceed 300 characters"]
    },

    likes: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
      }
    ],

    comments: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Comment"
      }
    ],

    is_pinned: {
      type: Boolean,
      default: false
    },

    communityId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Community",
      required: true
    },

    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },

    pollId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Poll"
    }
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

const Post = mongoose.model('Post', postSchema);

export default Post;