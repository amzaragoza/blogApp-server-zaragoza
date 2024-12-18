const express = require("express");

const router = express.Router();

const userController = require("../controllers/user.js");

const { verify } = require("../auth.js");

router.post("/register", userController.registerUser);

router.post("/login", userController.loginUser);

router.get("/details",verify, userController.getProfile)

module.exports = router;