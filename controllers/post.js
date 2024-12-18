const Post = require("../models/Post");
const { errorHandler } = require("../auth.js");

module.exports.addPost = (req, res) => {
    const author = `${req.user.email} (${req.user.id})`; // Combines email and user's unique ID from the JWT payload for uniqueness

    let newPost = new Post({
        title : req.body.title,
        content : req.body.content,
        author : author
    });
    Post.findOne({ title: req.body.title })
    .then(existingPost =>{
        if(existingPost){
            res.status(409).send({ message: 'Post already exists'})
        }else{
            return newPost.save()
            .then(result => res.status(201).send(result))
            .catch(error => errorHandler(error, req, res));
        }
    }).catch(error => errorHandler(error, req, res))
};

module.exports.getAllPosts = (req, res) => {
    return Post.find({})
    .then(result => {
        if(result.length <= 0) {
            return res.status(404).json({error: "No posts found"});
        }
        
        return res.status(200).json({posts: result})
    })
    .catch(error => errorHandler(error, req, res))
};

module.exports.getPostById = (req, res) => {
    return Post.findById(req.params.postId)
    .then(result => {
        if(!result) {
            return res.status(404).json({error: "Post not found"});
        }
        
        return res.status(200).json(result)
    })
    .catch(error => errorHandler(error, req, res))
};

module.exports.updatePost = (req, res) => {
    const postId = req.params.postId;
    const userId = req.user.id; // Current user's ID

    return Post.findById(postId)
        .then(post => {
            if (!post) {
                return res.status(404).send({ error: 'Post not found' });
            }

            // Extract stored user ID from post.author
            const authorId = post.author.split(' ')[1]?.replace('(', '').replace(')', '');

            // Check if the user is the author of the post
            if (authorId !== userId) {
                return res.status(403).send({ error: 'You do not have permission to update this post' });
            }

            // Prepare updated post object
            const updatedPost = {
                title: req.body.title,
                content: req.body.content,
                author: post.author // Keep the original author
            };

            return Post.findByIdAndUpdate(postId, updatedPost, { new: true })
                .then(updatedPost => {
                    return res.status(200).json({
                        message: 'Post updated successfully',
                        updatedPost
                    });
                })
                .catch(error => errorHandler(error, req, res));
        })
        .catch(error => errorHandler(error, req, res));
};


module.exports.deletePost = (req, res) => {
    const postId = req.params.postId;
    const userId = req.user.id; // Current user's ID

    return Post.findById(postId)
        .then(post => {
            if (!post) {
                return res.status(404).send({ error: 'Post not found' });
            }

            // Extract stored user ID from post.author
            const authorId = post.author.split(' ')[1]?.replace('(', '').replace(')', '');

            // Check if the user is the author or an admin
            if (authorId === userId || req.user.isAdmin) {
                return Post.deleteOne({ _id: postId })
                    .then(deleteStatus => {
                        if (deleteStatus.deletedCount > 0) {
                            return res.status(200).send({
                                message: 'Post deleted successfully'
                            });
                        } else {
                            return res.status(404).send({ error: 'Post not found' });
                        }
                    });
            } else {
                return res.status(403).send({
                    error: 'You do not have permission to delete this post'
                });
            }
        })
        .catch(error => errorHandler(error, req, res));
};



module.exports.addBlogComment = (req, res) => {
    const { comments } = req.body;

    // Check if `comments` exists, is an array, and all entries have a valid `comment` field
    if (!Array.isArray(comments) || comments.some(comment => typeof comment.comment !== 'string' || !comment.comment.trim())) {
        return res.status(400).json({ error: "Invalid comments data. Each comment must have a non-empty `comment` field." });
    }

    const userId = req.user.id;
    const newComments = comments.map(comment => ({
        userId,
        comment: comment.comment
    }));

    return Post.findOneAndUpdate(
        { _id: req.params.postId },
        { $push: { comments: { $each: newComments } } },
        { new: true }
    )
    .then(post => {
        if (post) {
            return res.status(200).json({
                message: "comment added successfully",
                updatedPost: post
            });
        } else {
            return res.status(404).json({ error: "Post not found" });
        }
    })
    .catch(error => errorHandler(error, req, res));
};


module.exports.removeBlogComments = (req, res) => {
    const { postId, commentId } = req.params;
    const userId = req.user.id; // Get the current user's ID

    return Post.findById(postId)
        .then(post => {
            if (!post) {
                return res.status(404).json({ error: "Post not found" });
            }
            
            // Find the comment to remove
            const comment = post.comments.id(commentId);
            if (!comment) {
                return res.status(404).json({ error: "Comment not found" });
            }
            
            // Check if the user is an admin or the author of the comment
            if (req.user.isAdmin || comment.userId.toString() === userId) {
                // Remove the comment using $pull
                post.comments.pull({ _id: commentId });
                return post.save()
                    .then(updatedPost => res.status(200).json({
                        message: "Comment removed successfully",
                        updatedPost
                    }));
            } else {
                return res.status(403).json({ error: "You do not have permission to delete this comment" });
            }
        })
        .catch(err => errorHandler(err, req, res));
};



module.exports.getCommentsById = (req, res) => {
    return Post.findById(req.params.postId)
    .then(result => {
        if (!result) {
            return res.status(404).json({ error: "Post not found" });
        }
        if (!result.comments || result.comments.length === 0) {
            return res.status(404).json({ error: "No comments found" });
        }

        return res.status(200).json(result.comments);
    })
    .catch(error => errorHandler(error, req, res));
};