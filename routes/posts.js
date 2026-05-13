const express = require("express");

const postController = require("./posts/post.controller");

const router = express.Router();

router.post(
  "/",
  postController.createPost
);

router.get(
  "/",
  postController.getAllPosts
);

router.get(
  "/:id",
  postController.getPostById
);

router.put(
  "/:id",
  postController.updatePost
);

router.delete(
  "/:id",
  postController.deletePost
);

module.exports = router;