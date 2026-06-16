// post.service.js — complete rewrite

import Post from '../../models/post.js';
import Poll from '../../models/poll.js';
import Comment from '../../models/comment.js';
import PollVote from '../../models/pollVote.js';

// ── Avatar helper ──────────────────────────────────────────────────────────────
// User schema has no avatar field, so we generate one from the name.
// UI Avatars is free, needs no API key, and returns a consistent image per name.
const getAvatarUrl = (user) => {
  if (!user) return 'https://ui-avatars.com/api/?name=User&background=5089D6&color=fff';
  const name = encodeURIComponent(user.name || user.username || 'User');
  return `https://ui-avatars.com/api/?name=${name}&background=5089D6&color=fff&bold=true`;
};

// ── Poll results injector ──────────────────────────────────────────────────────
// Reads votes from Poll.options[].votes[] (array of userIds already in schema).
// PollVote collection is NOT used here — only used by votePollService for
// duplicate enforcement via the unique index.
const injectPollResults = (post, currentUserId) => {
  // Works on plain objects (after .lean() or .toObject())
  if (!post.pollId || typeof post.pollId !== 'object') return post;

  const poll = post.pollId;
  if (!poll.options || !Array.isArray(poll.options)) return post;

  const totalVotes = poll.options.reduce(
    (sum, opt) => sum + (opt.votes?.length || 0),
    0
  );

  // Find which option the current user voted on (returns index or null)
  let userVote = null;
  if (currentUserId) {
    const uid = currentUserId.toString();
    userVote = poll.options.findIndex(
      (opt) => opt.votes?.some((v) => v.toString() === uid)
    );
    if (userVote === -1) userVote = null;
  }

  // Attach computed fields directly onto poll options
  poll.options = poll.options.map((opt, idx) => ({
    ...opt,
    voteCount: opt.votes?.length || 0,
    percentage: totalVotes > 0
      ? Math.round(((opt.votes?.length || 0) / totalVotes) * 100)
      : 0,
    votedByMe: idx === userVote,
  }));

  poll.totalVotes = totalVotes;
  poll.userVote = userVote;

  return post;
};

// ── Shared populate helper ─────────────────────────────────────────────────────
// Centralised so every service uses the exact same shape.
const populatePost = (query) =>
  query
    .populate('userId', 'name email role specialization avatar') // add avatar field for frontend use
    .populate({
      path: 'pollId',
      select: 'question options totalVotes',
    })
    .populate({
      path: 'comments',
      populate: {
        path: 'userId',
        select: 'name email role',
      },
    })
    .lean(); // lean() = plain JS objects, safe to mutate in injectPollResults

// ── After lean(), userId has no avatar — attach it here ───────────────────────
// const attachAvatars = (posts) =>
//   posts.map((post) => {
//     if (post.userId && typeof post.userId === 'object') {
//       post.userId.avatar = getAvatarUrl(post.userId);
//     }
//     if (Array.isArray(post.comments)) {
//       post.comments = post.comments.map((c) => {
//         if (c.userId && typeof c.userId === 'object') {
//           c.userId.avatar = getAvatarUrl(c.userId);
//         }
//         return c;
//       });
//     }
//     return post;
//   });
// ✅ fix
const attachAvatars = (posts) =>
  posts.map((post) => {
    if (post.userId && typeof post.userId === 'object') {
      post.userId.avatar = post.userId.avatar || getAvatarUrl(post.userId);
    }
    if (Array.isArray(post.comments)) {
      post.comments = post.comments.map((c) => {
        if (c.userId && typeof c.userId === 'object') {
          c.userId.avatar = c.userId.avatar || getAvatarUrl(c.userId);
        }
        return c;
      });
    }
    return post;
  });

// ── CREATE POST ────────────────────────────────────────────────────────────────
const createPostService = async (data) => {
  const { content, userId, pollData, communityId, is_pinned } = data;

  let pollId = null;

  if (pollData?.question && Array.isArray(pollData.options) && pollData.options.length >= 2) {
    const newPoll = await Poll.create({
      question: pollData.question,
      options: pollData.options.map((o) => ({ text: o.text, votes: [] })),
      userId,
      communityId: communityId || null,
    });
    pollId = newPoll._id;
  }

  const post = await Post.create({
    content,
    userId,
    communityId: communityId || null,
    is_pinned: is_pinned || false,
    pollId,
  });

  // Link the poll back to the post (useful for standalone poll queries)
  if (pollId) {
    await Poll.findByIdAndUpdate(pollId, { postId: post._id });
  }

  // Return fully populated post
  const populated = await populatePost(Post.findById(post._id));
  const [withAvatars] = attachAvatars([populated]);
  const withPoll = injectPollResults(withAvatars, userId);

  return {
    success: true,
    message: 'Post created successfully',
    data: withPoll,
  };
};

// ── GET ALL POSTS ──────────────────────────────────────────────────────────────
const getAllPostsService = async (currentUserId) => {
  const posts = await Post.find()
  .populate("userId")
  .populate({
    path: "comments",
    populate: { path: "userId", select: "name avatar role" }
  })
  .populate({
    path: "pollId",
    // see below for vote-aware population
  })
  .sort({ createdAt: -1 });

  const withAvatars = attachAvatars(posts);
  const withPolls = withAvatars.map((p) => injectPollResults(p, currentUserId));

  return {
    success: true,
    results: withPolls.length,
    data: withPolls,
  };
};

// ── GET POST BY ID ─────────────────────────────────────────────────────────────
const getPostByIdService = async (id, currentUserId) => {
  const posts = await Post.find()
  .populate("userId")
  .populate({
    path: "comments",
    populate: { path: "userId", select: "name avatar role" }
  })
  .populate({
    path: "pollId",
    // see below for vote-aware population
  })
  .sort({ createdAt: -1 });

  if (!post) {
    return { success: false, message: 'Post not found' };
  }

  const [withAvatars] = attachAvatars([post]);
  const withPoll = injectPollResults(withAvatars, currentUserId);

  return { success: true, data: withPoll };
};

// ── UPDATE POST ────────────────────────────────────────────────────────────────
const updatePostService = async (id, data, userId) => {
  const post = await Post.findById(id);

  if (!post) return { success: false, message: 'Post not found' };
  if (post.userId.toString() !== userId.toString()) {
    return { success: false, message: 'Unauthorized' };
  }

  const updatedPost = await populatePost(
    Post.findByIdAndUpdate(id, data, { new: true, runValidators: true })
  );

  const [withAvatars] = attachAvatars([updatedPost]);
  const withPoll = injectPollResults(withAvatars, userId);

  return {
    success: true,
    message: 'Post updated successfully',
    data: withPoll,
  };
};

// ── DELETE POST ────────────────────────────────────────────────────────────────
const deletePostService = async (id, userId) => {
  const post = await Post.findById(id);

  if (!post) return { success: false, message: 'Post not found' };
  if (post.userId.toString() !== userId.toString()) {
    return { success: false, message: 'Unauthorized' };
  }

  // Clean up linked poll and all comments
  if (post.pollId) {
    await Poll.findByIdAndDelete(post.pollId);
    await PollVote.deleteMany({ pollId: post.pollId });
  }
  await Comment.deleteMany({ postId: id });
  await Post.findByIdAndDelete(id);

  return { success: true, message: 'Post deleted successfully' };
};

// ── LIKE / UNLIKE POST ─────────────────────────────────────────────────────────
const likePostService = async (postId, userId) => {
  const post = await Post.findById(postId);
  if (!post) return { success: false, message: 'Post not found' };

  if (post.likes.map(String).includes(userId.toString())) {
    return { success: false, message: 'Post already liked' };
  }

  post.likes.push(userId);
  await post.save();

  return { success: true, message: 'Post liked successfully', data: { likes: post.likes } };
};

const unlikePostService = async (postId, userId) => {
  const post = await Post.findById(postId);
  if (!post) return { success: false, message: 'Post not found' };

  post.likes = post.likes.filter((id) => id.toString() !== userId.toString());
  await post.save();

  return { success: true, message: 'Post unliked successfully', data: { likes: post.likes } };
};

// ── ADD COMMENT ────────────────────────────────────────────────────────────────
const addCommentService = async (postId, userId, content) => {
  const posts = await Post.find()
  .populate("userId")
  .populate({
    path: "comments",
    populate: { path: "userId", select: "name avatar role" }
  })
  .populate({
    path: "pollId",
    // see below for vote-aware population
  })
  .sort({ createdAt: -1 });
  if (!post) return { success: false, message: 'Post not found' };

  const comment = await Comment.create({ content, userId, postId });

  post.comments.push(comment._id);
  await post.save();

  // Populate the comment's user for immediate frontend use
  await comment.populate('userId', 'name email role');

  // Attach avatar since User has no avatar field
  const commentObj = comment.toObject();
  if (commentObj.userId && typeof commentObj.userId === 'object') {
    // commentObj.userId.avatar = getAvatarUrl(commentObj.userId);
    // ✅ fix
    commentObj.userId.avatar = commentObj.userId.avatar || getAvatarUrl(commentObj.userId);
  }

  return {
    success: true,
    message: 'Comment added successfully',
    data: commentObj,
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
  addCommentService,
};