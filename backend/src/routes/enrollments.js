const express = require('express');
const Enrollment = require('../models/Enrollment');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.use(protect);

// GET /api/v1/enrollments - Get logged in user's enrollments
router.get('/', async (req, res, next) => {
    try {
        const enrollments = await Enrollment.find({ user: req.user.id })
            .populate({
                path: 'course',
                populate: { path: 'lessons', select: 'title' }
            })
            .populate({
                path: 'lastAccessedLesson',
                select: 'title'
            })
            .sort('-enrollmentDate');

        res.status(200).json({
            success: true,
            count: enrollments.length,
            data: enrollments
        });
    } catch (error) {
        next(error);
    }
});

module.exports = router;
