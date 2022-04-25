const express = require("express");
const app = express();
const mongoose = require("mongoose");
const config = require("config");
const cors = require("cors");

// routes
const users = require("./routes/users");
const auth = require("./routes/auth");
const posts = require("./routes/posts");

// production config
require("./production/config")(app);

// connection to mongoDB
const MONGO_URI = config.get("DB_URI") || "mongodb://localhost/omoide";
mongoose
  .connect(MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("Connected to MongoDB"))
  .catch((err) => console.log(err));

// jwt check
// if (!config.get("jwtPrivateKey")) {
//   console.log("FATAL ERROR: jwtPrivateKey is not defined");
//   process.exit(1);
// }

// middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use("/v1/users", users);
app.use("/v1/auth", auth);
app.use("/v1/posts", posts);

// server
const port = process.env.PORT || 5000;
app.listen(port, console.log(`Listening on port ${port}`));
