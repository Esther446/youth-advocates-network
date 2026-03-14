const express = require('express');
const {
    getCourseProgress,
    updateProgress
} = require('../controllers/progressController');
const { protect } = require('../middleware/auth');

const router = express.Router({ mergeParams: true });

router.use(protect);

router.route('/:courseId/progress')
    .get(getCourseProgress);

router.route('/:courseId/lesson/:lessonId')
    .patch(updateProgress);

module.exports = router;
