const mongoose = require('mongoose');

const opportunitySchema = new mongoose.Schema({
    title: {
        type: String,
        required: [true, 'Please provide an opportunity title'],
        trim: true
    },
    description: {
        type: String,
        required: [true, 'Please provide an opportunity description'],
        trim: true
    },
    type: {
        type: String,
        enum: ['funding', 'training', 'partnership', 'job', 'volunteer', 'other'],
        required: [true, 'Please specify the opportunity type']
    },
    deadline: {
        type: Date
    },
    amount: {
        type: String, // String to allow ranges like "$5,000 - $25,000"
        trim: true
    },
    duration: {
        type: String,
        trim: true
    },
    provider: {
        type: String,
        trim: true
    },
    location: {
        type: String,
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
opportunitySchema.index({ status: 1 });
opportunitySchema.index({ type: 1 });
opportunitySchema.index({ deadline: 1 });
opportunitySchema.index({ createdBy: 1 });

module.exports = mongoose.model('Opportunity', opportunitySchema);
