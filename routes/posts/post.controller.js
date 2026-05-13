const postService = require("./post.service");
const Joi = require("joi");

const {
  createPostSchema,
  updatePostSchema,
  idParamSchema
} = require("../../validations/postValidation");

const createPost = async (req, res, next) => {
  const { error } = createPostSchema.validate(req.body);
  if (error) return res.status(400).json({ success: false, message: error.details[0].message });

  try {
    const result = await postService.createPostService(req.body);

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
  const { error } = idParamSchema.validate({ id: req.params.id });
  if (error) return res.status(400).json({ success: false, message: error.details[0].message });

  try {

    const result = await postService.getPostByIdService(req.params.id);

    if (!result.success) {
      return res.status(404).json(result);
    }

    return res.status(200).json(result);

  } catch (error) {
    next(error);
  }
};

const updatePost = async (req, res, next) => {
  const paramError = idParamSchema.validate({ id: req.params.id });
  if (paramError.error) return res.status(400).json({ success: false, message: paramError.error.details[0].message });

  const bodyError = updatePostSchema.validate(req.body);
  if (bodyError.error) return res.status(400).json({ success: false, message: bodyError.error.details[0].message });

  try {

    const result = await postService.updatePostService(
      req.params.id,
      req.body
    );

    if (!result.success) {
      return res.status(404).json(result);
    }

    return res.status(200).json(result);

  } catch (error) {
    next(error);
  }
};

const deletePost = async (req, res, next) => {
  const { error } = idParamSchema.validate({ id: req.params.id });
  if (error) return res.status(400).json({ success: false, message: error.details[0].message });

  try {

    const result = await postService.deletePostService(req.params.id);

    if (!result.success) {
      return res.status(404).json(result);
    }

    return res.status(200).json(result);

  } catch (error) {
    next(error);
  }
};

module.exports = {
  createPost,
  getAllPosts,
  getPostById,
  updatePost,
  deletePost
};