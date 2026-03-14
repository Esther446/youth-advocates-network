const express = require('express');
const {
    getLessons,
    getLesson,
    createLesson,
    updateLesson,
    deleteLesson
} = require('../controllers/lessonController');
const { protect, authorize } = require('../middleware/auth');
const validate = require('../middleware/validate');
const { check } = require('express-validator');
const { checkCourseOwnership, checkLessonOwnership } = require('../middleware/ownership');

// Optional auth middleware for endpoints that can be public but alter state if logged in
const optionalAuth = async (req, res, next) => {
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        return protect(req, res, next);
    }
    next();
};

const router = express.Router({ mergeParams: true });

router.route('/')
    .get(optionalAuth, getLessons)
    .post(
        protect,
        authorize('admin', 'partner'),
        checkCourseOwnership,
        [
            check('title', 'Title is required').not().isEmpty(),
            check('content', 'Content is required').not().isEmpty(),
            check('order', 'Order index is required').isNumeric()
        ],
        validate,
        createLesson
    );

router.route('/:id')
    .get(optionalAuth, getLesson)
    .put(protect, authorize('admin', 'partner'), checkLessonOwnership, updateLesson)
    .delete(protect, authorize('admin', 'partner'), checkLessonOwnership, deleteLesson);

module.exports = router;
