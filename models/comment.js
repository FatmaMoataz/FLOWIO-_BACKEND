import mongoose from 'mongoose';

const commentSchema = new mongoose.Schema(
  {
    content: {
      type: String,
      required: true,
      minLength: [1, "Comment content must be at least 1 character long"],
      maxLength: [200, "Comment content cannot exceed 200 characters"]
    },

    userId: { 
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },

    postId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Post",
      required: true
    }
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

const Comment = mongoose.model('Comment', commentSchema);

export default Comment;