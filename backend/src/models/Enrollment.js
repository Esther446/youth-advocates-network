const mongoose = require('mongoose');

const EnrollmentSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.ObjectId,
        ref: 'User',
        required: true
    },
    course: {
        type: mongoose.Schema.ObjectId,
        ref: 'Course',
        required: true
    },
    enrollmentDate: {
        type: Date,
        default: Date.now
    },
    status: {
        type: String,
        enum: ['active', 'completed'],
        default: 'active'
    },
    progress: {
        type: Number,
        min: 0,
        max: 100,
        default: 0
    },
    completedLessons: [{
        type: mongoose.Schema.ObjectId,
        ref: 'Lesson'
    }],
    lastAccessedLesson: {
        type: mongoose.Schema.ObjectId,
        ref: 'Lesson'
    },
    completionDate: {
        type: Date
    }
}, {
    timestamps: true
});

// Prevent duplicate enrollments
EnrollmentSchema.index({ user: 1, course: 1 }, { unique: true });

module.exports = mongoose.model('Enrollment', EnrollmentSchema);
