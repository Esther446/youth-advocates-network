const mongoose = require('mongoose');

const LessonSchema = new mongoose.Schema({
    course: {
        type: mongoose.Schema.ObjectId,
        ref: 'Course',
        required: true
    },
    title: {
        type: String,
        required: [true, 'Please add a lesson title'],
        trim: true
    },
    content: {
        // Could be markdown, HTML, or JSON depending on the rich text editor
        type: String,
        required: [true, 'Please add lesson content']
    },
    order: {
        type: Number,
        required: true
    },
    videoUrl: {
        type: String,
        match: [
            /https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)/,
            'Please use a valid URL with HTTP or HTTPS'
        ]
    },
    resources: {
        type: [String], // Array of URLs to PDFs, etc.
        default: []
    },
    isQuiz: {
        type: Boolean,
        default: false
    }
}, {
    timestamps: true
});

// Enforce unique order per course
LessonSchema.index({ course: 1, order: 1 }, { unique: true });

module.exports = mongoose.model('Lesson', LessonSchema);
