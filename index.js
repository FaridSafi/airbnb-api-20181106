const express = require("express");
const bodyParser = require("body-parser");
const app = express();
app.use(bodyParser.json());
const SHA256 = require("crypto-js/sha256");
const encBase64 = require("crypto-js/enc-base64");
const uid2 = require("uid2");
var validator = require("validator");

const mongoose = require("mongoose");
mongoose.connect(
  "mongodb://farid:azerty75@ds125422.mlab.com:25422/airbnb-api-20181106",
  { useNewUrlParser: true }
);

const UserModel = mongoose.model("User", {
  account: {
    username: {
      type: String,
      unique: true,
      required: true
    },
    biography: String
  },
  email: {
    type: String,
    unique: true,
    required: true
  },
  token: String,
  hash: String,
  salt: String
});

app.post("/api/user/sign_up", function(req, res) {
  if (validator.isEmail(req.body.email) === false) {
    return res.status(400).json({ message: "Invalid email" });
  }

  const password = req.body.password;
  const salt = uid2(16);
  const hash = SHA256(password + salt).toString(encBase64);

  const newUser = new UserModel({
    account: {
      username: req.body.username,
      biography: req.body.biography
    },
    email: req.body.email,
    token: uid2(16),
    salt: salt,
    hash: hash
  }); // newUser est une instance du model User

  newUser.save(function(err, userSaved) {
    if (err) {
      res.status(400).json({ error: err.message });
    } else {
      res.json({
        _id: newUser._id,
        token: newUser.token,
        account: {
          username: newUser.account.username,
          biography: newUser.account.biography
        }
      });
    }
  });
});

app.post("/api/user/log_in", function(req, res) {
  const email = req.body.email;
  const password = req.body.password;

  UserModel.findOne({ email: email }).exec(function(err, userFound) {
    const salt = userFound.salt;
    const hash = SHA256(password + salt).toString(encBase64);
    if (hash === userFound.hash) {
      res.json({
        _id: "5a833c6be635aeb3fc249e04",
        token: "u6C1HwUH45qQvT5e",
        account: {
          username: "Farid",
          biography: "CTO @ Le Reacteur"
        }
      });
    } else {
      res.json({ error: "Invalid email/password" });
    }
  });
});

app.get("/api/user/:id", function(req, res) {
  // req.headers.authorization

  // 1) On vérifie la validité du token
  UserModel.findOne({
    token: req.headers.authorization.replace("Bearer ", "")
  }).exec(function(err, userAuthenticated) {
    if (userAuthenticated && !err) {
      // 2) On retourne les infos de l'utilisateur demandé
      UserModel.findOne({ _id: req.params.id }).exec(function(err, userFound) {
        res.json(userFound);
      });
    } else {
      res.status(401).json({ error: "An error occurred" });
    }
  });
});

// Démarrer serveur
app.listen(3000, function() {
  console.log("Server started");
});
