import postService from './post.service.js';
import Notification from '../../models/notification.js';
import Post from '../../models/post.js'; // adjust path if needed

const createPost = async (req, res, next) => {
  try {
    const result = await postService.createPostService({
      ...req.body,
      userId: req.user._id
    });

    // Notify mentioned users if any
    const mentionedUserIds = req.body.mentionedUserIds || [];
    if (mentionedUserIds.length > 0) {
      await Promise.all(
        mentionedUserIds
          .filter(id => String(id) !== String(req.user._id)) // don't notify yourself
          .map(userId =>
            Notification.create({
              title: "You were mentioned",
              message: `${req.user.name} mentioned you in a post`,
              type: "MENTION",
              userId,
              fromUserId: req.user._id,
              referenceId: result.data._id,
              referenceModel: "Post",
            })
          )
      );
    }

    return res.status(201).json(result);
  } catch (error) {
    next(error);
  }
};

const likePost = async (req, res, next) => {
  try {
    const result = await postService.likePostService(req.params.id, req.user._id);

    // Notify post owner
    const post = await Post.findById(req.params.id).select('userId');
    if (post && String(post.userId) !== String(req.user._id)) {
      await Notification.create({
        title: "New Like",
        message: `${req.user.name} liked your post`,
        type: "LIKE",
        userId: post.userId,
        fromUserId: req.user._id,
        referenceId: post._id,
        referenceModel: "Post",
      });
    }

    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

const addComment = async (req, res, next) => {
  try {
    const result = await postService.addCommentService(
      req.params.id,
      req.user._id,
      req.body.content
    );

    // Notify post owner
    const post = await Post.findById(req.params.id).select('userId');
    if (post && String(post.userId) !== String(req.user._id)) {
      await Notification.create({
        title: "New Comment",
        message: `${req.user.name} commented: "${req.body.content?.slice(0, 60)}"`,
        type: "COMMENT",
        userId: post.userId,
        fromUserId: req.user._id,
        referenceId: post._id,
        referenceModel: "Post",
      });
    }

    return res.status(201).json(result);
  } catch (error) {
    next(error);
  }
};

// getAllPosts, getPostById, updatePost, deletePost, unlikePost stay exactly the same

const getAllPosts = async (req, res, next) => {
  try {
    const result = await postService.getAllPostsService(req.user?._id);

    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

const getPostById = async (req, res, next) => {
  try {
    const result = await postService.getPostByIdService(
      req.params.id
    );

    if (!result.success) {
      return res.status(404).json(result);
    }

    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

const updatePost = async (req, res, next) => {
  try {
    const result = await postService.updatePostService(
      req.params.id,
      req.body,
      req.user._id
    );

    if (!result.success) {
      return res.status(400).json(result);
    }

    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

const deletePost = async (req, res, next) => {
  try {
    const result = await postService.deletePostService(
      req.params.id,
      req.user._id
    );

    if (!result.success) {
      return res.status(400).json(result);
    }

    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

const unlikePost = async (req, res, next) => {
  try {
    const result = await postService.unlikePostService(
      req.params.id,
      req.user._id
    );

    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

export {
  createPost,
  getAllPosts,
  getPostById,
  updatePost,
  deletePost,
  likePost,
  unlikePost,
  addComment
};