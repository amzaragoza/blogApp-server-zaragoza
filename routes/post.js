const express = require("express");

const router = express.Router();

const postController = require("../controllers/post.js");

const { verify, verifyAdmin } = require("../auth.js");

router.post("/addPost", verify, postController.addPost); // authenticated users

router.get("/getPosts", postController.getAllPosts); // all users

router.get("/getPost/:postId", postController.getPostById); // all users

router.patch("/updatePost/:postId", verify, postController.updatePost); // authenticated users

router.delete("/deletePost/:postId", verify, postController.deletePost); // authenticated users and admin

router.post("/addComment/:postId", verify, postController.addBlogComment); // authenticated users

router.delete("/removeComments/:postId/:commentId", verify, postController.removeBlogComments); // authenticated users and admin

router.get("/getComments/:postId", postController.getCommentsById); // all users

module.exports = router;