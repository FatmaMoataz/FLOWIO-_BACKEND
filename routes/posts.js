import express from 'express';
import * as postController from './posts/post.controller.js';
import { validate } from '../middleware/validation.middleware.js';
import { createPostSchema, updatePostSchema, idParamSchema, commentSchema } from '../validations/postValidation.js';
import auth from '../middleware/auth.middleware.js';

const router = express.Router();

router.post(
  "/",
  auth,
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
  auth,
  validate(idParamSchema, "params"),
  validate(updatePostSchema),
  postController.updatePost
);

router.delete(
  "/:id",
  auth,
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

export default router;