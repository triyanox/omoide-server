const { Post, validatePost } = require("../models/post");
const { User } = require("../models/user");
const { nanoid } = require("nanoid");
const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");

// create a post
router.post("/", auth, async (req, res) => {
  try {
    const checkUser = await User.findOne({ _id: req.user._id });
    if (checkUser.isDemo) {
      let postCount = await Post.countDocuments({
        userId: req.user.userId,
      });
      if (postCount >= 3) {
        return res.status(400).send("You can only create 3 memories");
      }
    }
    const { error } = validatePost(req.body);
    if (error) return res.status(400).send(error.details[0].message);

    let post_title = req.body.title;
    let post_content = req.body.content;
    let category = req.body.category;
    let user = req.user;
    let link = nanoid(10);

    let newPost = {
      title: post_title,
      content: post_content,
      category: category,
      userId: user._id,
      link: link,
    };
    await Post.create(newPost);
    return res.send(newPost);
  } catch (ex) {
    return res.status(500).send("Internal server error");
  }
});

// delete a post
router.delete("/:link", auth, async (req, res) => {
  try {
    const post = await Post.findOneAndDelete({ link: req.params.link });
    if (!post) return res.status(404).send("Memory not found");
    return res.status(200).send(post);
  } catch (ex) {
    return res.status(500).send("Internal server error");
  }
});

// update a post
router.put("/:link", auth, async (req, res) => {
  try {
    const post = await Post.findOneAndUpdate(
      { link: req.params.link, userId: req.user._id },
      {
        $set: {
          title: req.body.title,
          content: req.body.content,
          category: req.body.category,
          updatedAt: Date.now(),
        },
      },
      { new: true }
    );
    if (!post) return res.status(404).send("Memory not found");

    return res.status(200).send(post);
  } catch (ex) {
    return res.status(500).send("Internal server error");
  }
});

// get a post
router.get("/:link", async (req, res) => {
  try {
    const post = await Post.findOne({ link: req.params.link });
    await Post.findOneAndUpdate(
      { link: req.params.link },
      {
        reads: post.reads + 1,
      },
      { new: true }
    );
    if (!post) return res.status(404).send("Memory not found");
    return res.status(200).send(post);
  } catch (ex) {
    return res.status(500).send("Internal server error");
  }
});

// get all posts by user link
router.get("/user/:link", async (req, res) => {
  try {
    const user = await User.findOne({ link: req.params.link });
    if (!user) return res.status(404).send("User not found");
    const posts = await Post.find({ userId: user._id });
    if (!posts) return res.status(404).send("Memory not found");
    return res.status(200).send(posts);
  } catch (ex) {
    console.log(ex);
    return res.status(500).send("Internal server error");
  }
});

// get all posts by user id
router.get("/userid/:id", async (req, res) => {
  try {
    const user = await User.findOne({ _id: req.params.id });
    if (!user) return res.status(404).send("User not found");
    const posts = await Post.find({ userId: user._id });
    if (!posts) return res.status(404).send("Memory not found");
    return res.status(200).send(posts);
  } catch (ex) {
    console.log(ex);
    return res.status(500).send("Internal server error");
  }
});

// get all posts by category
router.get("/category/:category", async (req, res) => {
  try {
    const posts = await Post.find({ category: req.params.category })
      .sort({
        createdAt: -1,
      })
      .limit(10);

    if (!posts) return res.status(404).send("Memory not found");
    return res.status(200).send(posts);
  } catch (ex) {
    return res.status(500).send("Internal server error");
  }
});

// get all posts
router.get("/", async (req, res) => {
  try {
    const posts = await Post.find().sort({ createdAt: -1 });
    if (!posts) return res.status(404).send("Memory not found");
    return res.status(200).send(posts);
  } catch (ex) {
    return res.status(500).send("Internal server error");
  }
});

// paginate posts
router.get("/paginate/:page", async (req, res) => {
  try {
    const page = req.params.page;
    const limit = 10;
    const posts = await Post.find()

      .skip(limit * (page - 1))
      .limit(limit)
      .sort({ createdAt: -1 });
    if (!posts) return res.status(404).send("Memory not found");
    return res.status(200).send(posts);
  } catch (ex) {
    return res.status(500).send("Internal server error");
  }
});

// get posts by category and paginate
router.get("/category/:category/:page", async (req, res) => {
  try {
    const page = req.params.page;
    const limit = 9;
    const posts = await Post.find({ category: req.params.category })
      .skip(limit * (page - 1))
      .limit(limit)
      .sort({ createdAt: -1 });
    if (!posts) return res.status(404).send("Memory not found");
    return res.status(200).send(posts);
  } catch (ex) {
    return res.status(500).send("Internal server error");
  }
});

// update likes
router.put("/likes/:link", auth, async (req, res) => {
  try {
    const post = await Post.findOne({ link: req.params.link });
    if (!post) return res.status(404).send("Memory not found");
    const likes = post.likes + 1;
    const updatedPost = await Post.findOneAndUpdate(
      { link: req.params.link },
      {
        $set: {
          likes: likes,
        },
      },
      { new: true }
    );
    return res.status(200).send(updatedPost);
  } catch (ex) {
    return res.status(500).send("Internal server error");
  }
});

// get latest posts
router.get("/allposts/latest", async (req, res) => {
  try {
    const posts = await Post.find({}).sort({ createdAt: -1 }).limit(3);
    if (!posts) return res.status(404).send("Memory not found");
    return res.status(200).send(posts);
  } catch (ex) {
    return res.status(500).send("Internal server error");
  }
});

// get all posts by likes
router.get("/allposts/likes", async (req, res) => {
  try {
    const posts = await Post.find({}).sort({ likes: -1 }).limit(3);
    if (!posts) return res.status(404).send("Memory not found");
    return res.status(200).send(posts);
  } catch (ex) {
    return res.status(500).send("Internal server error");
  }
});

// get all posts by reads
router.get("/allposts/reads", async (req, res) => {
  try {
    const posts = await Post.find({}).sort({ reads: -1 }).limit(3);
    if (!posts) return res.status(404).send("Memory not found");
    return res.status(200).send(posts);
  } catch (ex) {
    return res.status(500).send("Internal server error");
  }
});

// find a post by title or content
router.get("/search/:search", async (req, res) => {
  try {
    const posts = await Post.find({
      $or: [
        { title: { $regex: req.params.search, $options: "i" } },
        { content: { $regex: req.params.search, $options: "i" } },
      ],
    });
    if (!posts) return res.status(404).send("Memory not found");
    return res.status(200).send(posts);
  } catch (ex) {
    return res.status(500).send("Internal server error");
  }
});

module.exports = router;
