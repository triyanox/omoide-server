const { User, validateUser } = require("../models/user");
const { Post } = require("../models/post");
const express = require("express");
const router = express.Router();
const _ = require("lodash");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const config = require("config");
const { nanoid } = require("nanoid");
const auth = require("../middleware/auth");

// create a new user
router.post("/", async (req, res) => {
  try {
    const { error } = validateUser(req.body);
    if (error) return res.status(400).send(error.details[0].message);
    let user = await User.findOne({ email: req.body.email });
    if (user) return res.status(400).send("User already registered.");
    user = new User(_.pick(req.body, ["name", "email", "password"]));
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(user.password, salt);
    user.link = nanoid(7);
    await user.save();
    const token = user.generateAuthToken();
    res
      .header("x-auth-token", token)
      .header("access-control-expose-headers", "x-auth-token")
      .send(_.pick(user, ["_id", "name", "email", "link"]));
  } catch (ex) {
    return res.status(500).send("Internal server error");
  }
});

// delete a user
router.delete("/", auth, async (req, res) => {
  const checkUser = await User.findOne({ _id: req.user._id });
  if (!checkUser) {
    return res.status(404).send("User not found");
  }
  if (checkUser.isDemo) {
    return res.status(403).send("Cannot delete demo user");
  }
  const user = await User.findOneAndDelete({ _id: req.user._id });
  await Post.deleteMany({ userId: req.user._id });
  res.status(200).send(user);
});

// update a user
router.put("/", auth, async (req, res) => {
  try {
    const user_id = req.user._id;
    const checkUser = await User.findById(user_id);
    if (checkUser.isDemo) {
      return res.status(403).send("You can't update a demo user");
    }
    const { error } = validateUser(req.body);
    if (error) {
      res.status(400).json({
        error: error.details[0].message,
      });
    } else {
      const salt = await bcrypt.genSalt(10);
      const password = await bcrypt.hash(req.body.password, salt);

      const user = await User.findByIdAndUpdate(
        user_id,
        {
          name: req.body.name,
          email: req.body.email,
          password: password,
        },
        { new: true }
      );
      if (!user) {
        return res.status(404).send("The user was not found.");
      }
      const token = user.generateAuthToken();
      res
        .header("x-auth-token", token)
        .header("access-control-expose-headers", "x-auth-token")
        .send(user)
        .status(200);
    }
  } catch (ex) {
    return res.status(500).send("Internal server error");
  }
});

// get a user by link
router.get("/:link", async (req, res) => {
  try {
    const user = await User.findOne({ link: req.params.link });
    if (!user) return res.status(404).send("User not found");
    return res
      .status(200)
      .send(_.pick(user, ["_id", "name", "email", "link", "isDemo"]));
  } catch (ex) {
    return res.status(500).send("Internal server error");
  }
});

// get user by id
router.get("/user/:id", async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).send("User not found");
    return res.status(200).send(user);
  } catch {
    return res.status(500).send("Internal server error");
  }
});

module.exports = router;
