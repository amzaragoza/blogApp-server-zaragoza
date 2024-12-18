const mongoose = require('mongoose');

const postSchema = new mongoose.Schema({
	title: {
        type: String,
        required: [true, "Post Title is Required"]
    },
    content: {
        type: String,
        required: [true, 'Post Content is Required']
    },
	author: {
		type: String,
		required: [true, 'Author Information is Required']
	},
	createdOn: {
        type: Date,
        default: Date.now
    },
    comments: [
        {
            userId: {
                type: String
            },
            comment: {
                type: String
            }
        }
    ]
});

module.exports = mongoose.model('Post', postSchema);