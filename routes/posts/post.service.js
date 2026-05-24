import Post from '../../models/post.js';
import Comment from '../../models/comment.js';

const createPostService = async (data) => {
  const post = await Post.create(data);

  await post.populate("communityId userId pollId");

  return {
    success: true,
    message: "Post created successfully",
    data: post
  };
};

const getAllPostsService = async () => {
  const posts = await Post.find()
    .populate("communityId")
    .populate("userId", "username email")
    .populate("pollId")
    .populate({
      path: "comments",
      populate: {
        path: "userId",
        select: "username email"
      }
    });

  return {
    success: true,
    results: posts.length,
    data: posts
  };
};

const getPostByIdService = async (id) => {
  const post = await Post.findById(id)
    .populate("communityId")
    .populate("userId", "username email")
    .populate("pollId")
    .populate({
      path: "comments",
      populate: {
        path: "userId",
        select: "username email"
      }
    });

  if (!post) {
    return {
      success: false,
      message: "Post not found"
    };
  }

  return {
    success: true,
    data: post
  };
};

const updatePostService = async (id, data, userId) => {
  const post = await Post.findById(id);

  if (!post) {
    return {
      success: false,
      message: "Post not found"
    };
  }

  if (post.userId.toString() !== userId.toString()) {
    return {
      success: false,
      message: "Unauthorized"
    };
  }

  const updatedPost = await Post.findByIdAndUpdate(id, data, {
    new: true,
    runValidators: true
  })
    .populate("communityId")
    .populate("userId")
    .populate("pollId");

  return {
    success: true,
    message: "Post updated successfully",
    data: updatedPost
  };
};

const deletePostService = async (id, userId) => {
  const post = await Post.findById(id);

  if (!post) {
    return {
      success: false,
      message: "Post not found"
    };
  }

  if (post.userId.toString() !== userId.toString()) {
    return {
      success: false,
      message: "Unauthorized"
    };
  }

  await Post.findByIdAndDelete(id);

  return {
    success: true,
    message: "Post deleted successfully"
  };
};

const likePostService = async (postId, userId) => {
  const post = await Post.findById(postId);

  if (!post) {
    return {
      success: false,
      message: "Post not found"
    };
  }

  const alreadyLiked = post.likes.includes(userId);

  if (alreadyLiked) {
    return {
      success: false,
      message: "Post already liked"
    };
  }

  post.likes.push(userId);

  await post.save();

  return {
    success: true,
    message: "Post liked successfully"
  };
};

const unlikePostService = async (postId, userId) => {
  const post = await Post.findById(postId);

  if (!post) {
    return {
      success: false,
      message: "Post not found"
    };
  }

  post.likes = post.likes.filter(
    (id) => id.toString() !== userId.toString()
  );

  await post.save();

  return {
    success: true,
    message: "Post unliked successfully"
  };
};

const addCommentService = async (
  postId,
  userId,
  content
) => {
  const post = await Post.findById(postId);

  if (!post) {
    return {
      success: false,
      message: "Post not found"
    };
  }

  const comment = await Comment.create({
    content,
    userId,
    postId
  });

  post.comments.push(comment._id);

  await post.save();

  return {
    success: true,
    message: "Comment added successfully",
    data: comment
  };
};

export default {
  createPostService,
  getAllPostsService,
  getPostByIdService,
  updatePostService,
  deletePostService,
  likePostService,
  unlikePostService,
  addCommentService
};