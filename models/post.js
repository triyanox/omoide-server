const Joi = require("joi");
const mongoose = require("mongoose");

const postSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    minlength: 5,
    maxlength: 255,
  },
  content: {
    type: String,
    required: true,
    minlength: 5,
    maxlength: 2048,
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
  link: {
    type: String,
    required: true,
    minlength: 5,
    maxlength: 1024,
  },
  likes: {
    type: Number,
    default: 0,
  },
  reads: {
    type: Number,
    default: 0,
  },
  category: {
    type: String,
    required: true,
    minlength: 3,
    maxlength: 255,
  },
});

const Post = mongoose.model("Post", postSchema);

const validatePost = (post) => {
  const schema = Joi.object({
    title: Joi.string().min(5).max(255).required(),
    content: Joi.string().min(5).max(2048).required(),
    category: Joi.string().min(3).max(255).required(),
  });
  const result = schema.validate({
    title: post.title,
    content: post.content,
    category: post.category,
  });
  return result;
};

exports.Post = Post;
exports.validatePost = validatePost;
