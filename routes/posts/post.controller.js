import * as postService from "./post.service.js";

const createPost = async (req, res, next) => {
  try {
    const result = await postService.createPostService({
      ...req.body,
      userId: req.user._id
    });

    return res.status(201).json(result);
  } catch (error) {
    next(error);
  }
};

const getAllPosts = async (req, res, next) => {
  try {
    const result = await postService.getAllPostsService();

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

const likePost = async (req, res, next) => {
  try {
    const result = await postService.likePostService(
      req.params.id,
      req.user._id
    );

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

const addComment = async (req, res, next) => {
  try {
    const result = await postService.addCommentService(
      req.params.id,
      req.user._id,
      req.body.content
    );

    return res.status(201).json(result);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createPost,
  getAllPosts,
  getPostById,
  updatePost,
  deletePost,
  likePost,
  unlikePost,
  addComment
};