const Lesson = require('../models/Lesson');
const Course = require('../models/Course');


// @desc    Get lessons for a course
// @route   GET /api/v1/courses/:courseId/lessons
// @access  Public (Enrolled/Admin)
exports.getLessons = async (req, res, next) => {
    try {
        let query;

        if (req.params.courseId) {
            query = Lesson.find({ course: req.params.courseId });
        } else {
            query = Lesson.find().populate({
                path: 'course',
                select: 'title description'
            });
        }

        query = query.sort('order');
        const lessons = await query;

        res.status(200).json({
            success: true,
            count: lessons.length,
            data: lessons
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Get single lesson
// @route   GET /api/v1/lessons/:id
// @access  Public (Enrolled/Admin check handled at frontend or specialized middleware)
exports.getLesson = async (req, res, next) => {
    try {
        const lesson = await Lesson.findById(req.params.id).populate({
            path: 'course',
            select: 'title description status createdBy'
        });

        if (!lesson) {
            return res.status(404).json({ success: false, message: `No lesson with the id of ${req.params.id}` });
        }

        res.status(200).json({
            success: true,
            data: lesson
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Add lesson
// @route   POST /api/v1/courses/:courseId/lessons
// @access  Private (Partner, Admin)
exports.createLesson = async (req, res, next) => {
    try {
        req.body.course = req.params.courseId;

        const lesson = await Lesson.create(req.body);

        res.status(201).json({
            success: true,
            data: lesson
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Update lesson
// @route   PUT /api/v1/lessons/:id
// @access  Private (Partner, Admin)
exports.updateLesson = async (req, res, next) => {
    try {
        const lesson = await Lesson.findByIdAndUpdate(req.params.id, req.body, {
            new: true,
            runValidators: true
        });

        res.status(200).json({
            success: true,
            data: lesson
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Delete lesson
// @route   DELETE /api/v1/lessons/:id
// @access  Private (Partner, Admin)
exports.deleteLesson = async (req, res, next) => {
    try {
        // req.lesson is set by checkLessonOwnership middleware
        await Lesson.findByIdAndDelete(req.lesson._id);

        res.status(200).json({
            success: true,
            data: {}
        });
    } catch (error) {
        next(error);
    }
};
