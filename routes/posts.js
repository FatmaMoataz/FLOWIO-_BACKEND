import express from 'express';
import postController from './posts/post.controller.js';
import { validate } from '../middleware/validation.middleware.js';
import { createPostSchema, updatePostSchema, idParamSchema, commentSchema } from '../validations/postValidation.js';

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

export default router;

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