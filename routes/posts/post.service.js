import Post from '../../models/post.js';
import Poll from '../../models/poll.js';
import Comment from '../../models/comment.js';
import mongoose from 'mongoose'; // 👈 ضفنا الـ import ده عشان نستخدم الموديلات التانية ديناميكياً

// ── دالة مساعدة لحساب وحقن تفاصيل الـ Poll جوه البوست 🗳️ ──
const injectPollResults = async (post, currentUserId) => {
  if (!post.pollId) return post;

  // تحويل الـ post لـ plain object عشان نقدر نعدل عليه بحرية ونضيف حقول جديدة
  const postObj = post.toObject ? post.toObject({ virtuals: true }) : post;
  const poll = postObj.pollId;

  if (poll && poll.options) {
    try {
      // 1. جلب كل الأصوات للـ Poll ده من جدول الـ PollVote
      const votes = await mongoose.model("PollVote").find({ pollId: poll._id });
      
      // 2. حساب الـ Breakdown لخيارات التصويت (هيبدأ بـ صفر لكل اختيار)
      const breakdown = {};
      poll.options.forEach(opt => {
        breakdown[opt.text] = 0;
      });

      // زياوة عداد الأصوات الحقيقية
      votes.forEach(v => {
        if (breakdown[v.optionText] !== undefined) {
          breakdown[v.optionText]++;
        }
      });

      // 3. معرفة إذا كان المستخدم الحالي صوّت وعلى أنهي خيار بالظبط
      let userVote = null;
      if (currentUserId) {
        const foundVote = votes.find(v => v.userId.toString() === currentUserId.toString());
        // لو صوّت، هنجيب الـ index (المكان) بتاع الاختيار ده في المصفوفة عشان الـ UI ينور عنده
        userVote = foundVote ? poll.options.findIndex(opt => opt.text === foundVote.optionText) : null;
      }

      // دمج البيانات الجديدة جوه الـ poll object عشان الفرونت إند يقرأها علطول 🎉
      postObj.pollId.breakdown = breakdown;
      postObj.pollId.totalVotes = votes.length;
      postObj.pollId.userVote = userVote; // هيرجع الـ index بتاعه (0, 1, 2...) أو null لو مّصوتش
    } catch (err) {
      console.error("Error embedding poll results to post:", err);
    }
  }

  return postObj;
};

// ── CREATE POST ────────────────────────────────────────────────────────────────
const createPostService = async (data) => {
  let createdPollId = null;

  // 1️⃣ لو البوست جاي معاه بيانات تصويت، هنكريت الـ Poll الأول 🗳️
  if (data.pollData && data.pollData.question) {
    const newPoll = await Poll.create({
      question: data.pollData.question,
      options: data.pollData.options, // المصفوفة اللي فيها الـ text
      userId: data.userId,
      communityId: data.communityId
    });
    createdPollId = newPoll._id;
  }

  // 2️⃣ تفكيك الداتا عشان نستبعد الـ pollData تماماً ونحمي المونجوز Schema 🛡️
  const { pollData, ...cleanData } = data;

  // إنشاء البوست وربطه بالـ Poll لو اتوجدت
  const postData = {
    ...cleanData,
    pollId: createdPollId || data.pollId
  };

  const post = await Post.create(postData);

  if (createdPollId) {
    await Poll.findByIdAndUpdate(createdPollId, { postId: post._id });
  }

  await post.populate("communityId userId pollId");

  // حقن تفاصيل الـ poll النظيف للبوست اللي راجع فوراً
  const completePost = await injectPollResults(post, data.userId);

  return {
    success: true,
    message: "Post created successfully",
    data: completePost
  };
};

// ── GET ALL POSTS ──────────────────────────────────────────────────────────────
const getAllPostsService = async (currentUserId) => {
  const posts = await Post.find()
    .sort({ createdAt: -1 }) // ترتيب تنازلي من الأحدث للأقدم عشان الـ Feed يظبط
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

  // تشغيل الحسابات وحقن الأصوات على كل البوستات بالتوازي
  const postsWithPolls = await Promise.all(
    posts.map(post => injectPollResults(post, currentUserId))
  );

  return {
    success: true,
    results: postsWithPolls.length,
    data: postsWithPolls
  };
};

// ── GET POST BY ID ─────────────────────────────────────────────────────────────
const getPostByIdService = async (id, currentUserId) => {
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

  const postWithPoll = await injectPollResults(post, currentUserId);

  return {
    success: true,
    data: postWithPoll
  };
};

// ── UPDATE POST ────────────────────────────────────────────────────────────────
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

  const completePost = await injectPollResults(updatedPost, userId);

  return {
    success: true,
    message: "Post updated successfully",
    data: completePost
  };
};

// ── DELETE POST ────────────────────────────────────────────────────────────────
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

// ── LIKE POST ──────────────────────────────────────────────────────────────────
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

// ── UNLIKE POST ────────────────────────────────────────────────────────────────
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

// ── ADD COMMENT ────────────────────────────────────────────────────────────────
const addCommentService = async (postId, userId, content) => {
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