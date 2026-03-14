const express = require('express');
const {
    getCourses,
    getCourse,
    createCourse,
    updateCourse,
    deleteCourse
} = require('../controllers/courseController');
const { createEnrollment } = require('../controllers/enrollmentController');
const { protect, authorize } = require('../middleware/auth');
const validate = require('../middleware/validate');
const { check } = require('express-validator');
const { checkCourseOwnership } = require('../middleware/ownership');

// Optional auth middleware for endpoints that can be public but alter state if logged in
const optionalAuth = async (req, res, next) => {
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        return protect(req, res, next);
    }
    next();
};

// Include other resource routers
const lessonRouter = require('./lessons');

const router = express.Router();

// Re-route into other resource routers
router.use('/:courseId/lessons', lessonRouter);

router.route('/')
    .get(optionalAuth, getCourses)
    .post(
        protect,
        authorize('admin', 'partner'),
        [
            check('title', 'Title is required').not().isEmpty(),
            check('description', 'Description is required').not().isEmpty(),
            check('duration', 'Duration is required').not().isEmpty(),
            check('quarter', 'Quarter is required').not().isEmpty()
        ],
        validate,
        createCourse
    );

router.route('/:id')
    .get(optionalAuth, getCourse)
    .put(protect, authorize('admin', 'partner'), checkCourseOwnership, updateCourse)
    .delete(protect, authorize('admin', 'partner'), checkCourseOwnership, deleteCourse);

// Enrollment route
router.route('/:id/enroll')
    .post(protect, authorize('public', 'member', 'applicant'), createEnrollment);

module.exports = router;
