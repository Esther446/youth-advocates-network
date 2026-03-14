const mongoose = require('mongoose');

const CourseSchema = new mongoose.Schema({
    title: {
        type: String,
        required: [true, 'Please add a course title'],
        trim: true,
        maxlength: [100, 'Title cannot be more than 100 characters']
    },
    description: {
        type: String,
        required: [true, 'Please add a description']
    },
    organization: {
        // Can optionally link a course directly to an organization
        type: mongoose.Schema.ObjectId,
        ref: 'Organization',
    },
    createdBy: {
        type: mongoose.Schema.ObjectId,
        ref: 'User',
        required: true
    },
    status: {
        type: String,
        enum: ['draft', 'published'],
        default: 'draft'
    },
    difficulty: {
        type: String,
        enum: ['beginner', 'intermediate', 'advanced'],
        default: 'beginner'
    },
    duration: {
        type: String,
        required: [true, 'Please specify an estimated duration (e.g., "5 hours")']
    },
    quarter: {
        type: String,
        enum: ['Q1', 'Q2', 'Q3', 'Q4'],
        required: [true, 'Please assign a targeted quarter']
    },
    category: {
        type: String,
        trim: true
    }
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Cascade delete lessons when a course is deleted
CourseSchema.pre('remove', async function (next) {
    await this.model('Lesson').deleteMany({ course: this._id });
    next();
});

// Reverse populate with virtuals
CourseSchema.virtual('lessons', {
    ref: 'Lesson',
    localField: '_id',
    foreignField: 'course',
    justOne: false
});

module.exports = mongoose.model('Course', CourseSchema);
