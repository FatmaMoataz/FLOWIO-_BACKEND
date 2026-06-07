import postService from './post.service.js';

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
    // سحب الـ ID بأمان لو الـ auth middleware حاطه في الـ req
    const currentUserId = req.user?._id || null; 
    
    const result = await postService.getAllPostsService(currentUserId);
    res.status(200).json(result);
  } catch (err) {
    next(err); // تمرير الخطأ للـ global error handler بدل ما يوقع السيرفر
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