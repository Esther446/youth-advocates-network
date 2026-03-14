const mongoose = require('mongoose');

const organizationSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Please provide an organization name'],
        trim: true
    },
    description: {
        type: String,
        required: [true, 'Please provide an organization description'],
        trim: true
    },
    type: {
        type: String,
        enum: ['ngo', 'cbo', 'initiative', 'school_club', 'other'],
        required: [true, 'Please specify the organization type']
    },
    focusArea: {
        type: String,
        trim: true
    },
    impactData: {
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
organizationSchema.index({ status: 1 });
organizationSchema.index({ type: 1 });
organizationSchema.index({ createdBy: 1 });

module.exports = mongoose.model('Organization', organizationSchema);
