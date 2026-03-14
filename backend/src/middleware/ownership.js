
const Course = require('../models/Course');
const Lesson = require('../models/Lesson');

// Middleware to check if user owns the course
exports.checkCourseOwnership = async (req, res, next) => {
    try {
        // ID could be in req.params.id or req.params.courseId depending on route
        const courseId = req.params.courseId || req.params.id;
        if (!courseId) {
            return next(); // Let validation handle missing ID
        }

        const course = await Course.findById(courseId);
        if (!course) {
            return res.status(404).json({ success: false, message: `Course not found with id of ${courseId}` });
        }

        // Make sure user is course creator or admin
        if (course.createdBy.toString() !== req.user.id && req.user.role !== 'admin') {
            return res.status(403).json({ success: false, message: `User ${req.user.id} is not authorized to manage this course` });
        }

        // Pass course to next middleware to prevent re-querying if needed
        req.course = course;
        next();
    } catch (error) {
        next(error);
    }
};

// Middleware to check if user owns the lesson (via course ownership)
exports.checkLessonOwnership = async (req, res, next) => {
    try {
        const lesson = await Lesson.findById(req.params.id).populate('course');

        if (!lesson) {
            return res.status(404).json({ success: false, message: `No lesson with the id of ${req.params.id}` });
        }

        // Make sure user is course creator or admin
        if (lesson.course.createdBy.toString() !== req.user.id && req.user.role !== 'admin') {
            return res.status(403).json({ success: false, message: `User ${req.user.id} is not authorized to manage this lesson` });
        }

        req.lesson = lesson;
        next();
    } catch (error) {
        next(error);
    }
};
