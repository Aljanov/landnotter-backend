const mongoose = require('mongoose');

const storySchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        trim: true,
        minlength: 3
    },
    content: {
        type: String,
        required: true,
        minlength: 10
    },
    location: {
        type: {
            type: String,
            enum: ['Point'],
            required: true
        },
        coordinates: {
            type: [Number],
            required: true
        },
        address: {
            type: String,
            required: true
        }
    },
    images: [{
        type: String,
        validate: {
            validator: function(v) {
                return v.match(/^https?:\/\/.+$/);
            },
            message: 'Invalid image URL'
        }
    }],
    author: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    likes: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    comments: [{
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true
        },
        text: {
            type: String,
            required: true,
            trim: true
        },
        createdAt: {
            type: Date,
            default: Date.now
        }
    }],
    tags: [{
        type: String,
        trim: true
    }]
}, {
    timestamps: true
});

// Create a geospatial index on the location field
storySchema.index({ location: '2dsphere' });

const Story = mongoose.model('Story', storySchema);
module.exports = Story; 