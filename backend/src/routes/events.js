const express = require('express');
const {
    createEvent,
    getEvents,
    getEvent,
    updateEvent,
    deleteEvent
} = require('../controllers/eventController');
const { protect, authorize } = require('../middleware/auth');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const router = express.Router();
const { check } = require('express-validator');
const validate = require('../middleware/validate');

const optionalAuth = async (req, res, next) => {
    try {
        let token;
        if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
            token = req.headers.authorization.split(' ')[1];
        }
        if (token) {
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            req.user = await User.findById(decoded.id);
        }
        next();
    } catch (error) {
        next();
    }
};

router.route('/')
    .get(optionalAuth, getEvents)
    .post(
        protect,
        authorize('admin', 'partner'),
        [
            check('title', 'Title is required').not().isEmpty(),
            check('date', 'Date is required').not().isEmpty(),
            check('organization', 'Organization ID is required').not().isEmpty()
        ],
        validate,
        createEvent
    );

router.route('/:id')
    .get(optionalAuth, getEvent)
    .put(
        protect,
        authorize('admin', 'partner'),
        [
            check('title', 'Title is required').optional().not().isEmpty(),
            check('status', 'Invalid status').optional().isIn(['active', 'inactive', 'draft'])
        ],
        validate,
        updateEvent
    )
    .delete(protect, authorize('admin', 'partner'), deleteEvent);

module.exports = router;
