const express = require('express');
const router = express.Router();
const Story = require('../models/Story');
const auth = require('../middleware/auth');

// Create a new story
router.post('/', auth, async (req, res) => {
    try {
        const { title, content, location, images, tags } = req.body;

        const story = new Story({
            title,
            content,
            location,
            images,
            tags,
            author: req.user._id
        });

        await story.save();

        await story.populate('author', 'username profilePicture');
        
        res.status(201).json(story);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// Get all stories with optional filters
router.get('/', async (req, res) => {
    try {
        const { lat, lng, radius, search } = req.query;
        let query = {};

        // Location-based search
        if (lat && lng && radius) {
            query.location = {
                $near: {
                    $geometry: {
                        type: 'Point',
                        coordinates: [parseFloat(lng), parseFloat(lat)]
                    },
                    $maxDistance: parseInt(radius) * 1000 // Convert km to meters
                }
            };
        }

        // Text search
        if (search) {
            query.$or = [
                { title: { $regex: search, $options: 'i' } },
                { content: { $regex: search, $options: 'i' } },
                { tags: { $in: [new RegExp(search, 'i')] } }
            ];
        }

        const stories = await Story.find(query)
            .populate('author', 'username profilePicture')
            .sort({ createdAt: -1 });

        res.json(stories);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Get a specific story
router.get('/:id', async (req, res) => {
    try {
        const story = await Story.findById(req.params.id)
            .populate('author', 'username profilePicture')
            .populate('comments.user', 'username profilePicture');

        if (!story) {
            return res.status(404).json({ message: 'Story not found' });
        }

        res.json(story);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Update a story
router.patch('/:id', auth, async (req, res) => {
    try {
        const story = await Story.findById(req.params.id);

        if (!story) {
            return res.status(404).json({ message: 'Story not found' });
        }

        // Check if user is the author
        if (story.author.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Not authorized to update this story' });
        }

        const updates = Object.keys(req.body);
        const allowedUpdates = ['title', 'content', 'location', 'images', 'tags'];
        const isValidOperation = updates.every(update => allowedUpdates.includes(update));

        if (!isValidOperation) {
            return res.status(400).json({ message: 'Invalid updates' });
        }

        updates.forEach(update => story[update] = req.body[update]);
        await story.save();

        res.json(story);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// Delete a story
router.delete('/:id', auth, async (req, res) => {
    try {
        const story = await Story.findById(req.params.id);

        if (!story) {
            return res.status(404).json({ message: 'Story not found' });
        }

        // Check if user is the author
        if (story.author.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Not authorized to delete this story' });
        }

        await story.remove();
        res.json({ message: 'Story deleted' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Like/Unlike a story
router.post('/:id/like', auth, async (req, res) => {
    try {
        const story = await Story.findById(req.params.id);

        if (!story) {
            return res.status(404).json({ message: 'Story not found' });
        }

        const likeIndex = story.likes.indexOf(req.user._id);

        if (likeIndex === -1) {
            // Like the story
            story.likes.push(req.user._id);
        } else {
            // Unlike the story
            story.likes.splice(likeIndex, 1);
        }

        await story.save();
        res.json(story);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// Add a comment
router.post('/:id/comments', auth, async (req, res) => {
    try {
        const story = await Story.findById(req.params.id);

        if (!story) {
            return res.status(404).json({ message: 'Story not found' });
        }

        story.comments.push({
            user: req.user._id,
            text: req.body.text
        });

        await story.save();
        await story.populate('comments.user', 'username profilePicture');

        res.status(201).json(story);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

module.exports = router; 