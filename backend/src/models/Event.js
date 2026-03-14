const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema({
    title: {
        type: String,
        required: [true, 'Please provide an event title'],
        trim: true
    },
    description: {
        type: String,
        required: [true, 'Please provide an event description'],
        trim: true
    },
    type: {
        type: String,
        enum: ['summit', 'workshop', 'networking', 'showcase', 'webinar', 'training', 'bootcamp', 'conference', 'other'],
        required: [true, 'Please specify the event type']
    },
    date: {
        type: Date,
        required: [true, 'Please provide an event date']
    },
    time: {
        type: String,
        trim: true
    },
    location: {
        type: String,
        required: [true, 'Please provide an event location'],
        trim: true
    },
    image: {
        type: String,
        default: 'no-image.jpg'
    },
    status: {
        type: String,
        enum: ['active', 'inactive', 'draft'],
        default: 'draft'
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    }
}, {
    timestamps: true
});

// Indexing for common queries
eventSchema.index({ status: 1 });
eventSchema.index({ date: 1 });
eventSchema.index({ createdBy: 1 });

module.exports = mongoose.model('Event', eventSchema);
