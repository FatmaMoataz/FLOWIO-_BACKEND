const express = require('express');

const postController = require('./posts/post.controller');

const { validate } = require('../middleware/validation.middleware');

const {
  createPostSchema,
  updatePostSchema,
  idParamSchema,
  commentSchema
} = require('../validations/postValidation');

const router = express.Router();

router.post(
  "/",
  validate(createPostSchema),
  postController.createPost
);

router.get(
  "/",
  postController.getAllPosts
);

router.get(
  "/:id",
  validate(idParamSchema, "params"),
  postController.getPostById
);

router.put(
  "/:id",
  validate(idParamSchema, "params"),
  validate(updatePostSchema),
  postController.updatePost
);

router.delete(
  "/:id",
  validate(idParamSchema, "params"),
  postController.deletePost
);

router.post(
  "/:id/like",
  validate(idParamSchema, "params"),
  postController.likePost
);

router.delete(
  "/:id/like",
  validate(idParamSchema, "params"),
  postController.unlikePost
);

router.post(
  "/:id/comment",
  validate(idParamSchema, "params"),
  validate(commentSchema),
  postController.addComment
);

module.exports = router;