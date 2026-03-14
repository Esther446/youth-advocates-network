const express = require('express');
const {
    createOpportunity,
    getOpportunities,
    getOpportunity,
    updateOpportunity,
    deleteOpportunity
} = require('../controllers/opportunityController');
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
    .get(optionalAuth, getOpportunities)
    .post(
        protect,
        authorize('admin', 'partner'),
        [
            check('title', 'Title is required').not().isEmpty(),
            check('organization', 'Organization ID is required').not().isEmpty(),
            check('type', 'Type is required').not().isEmpty()
        ],
        validate,
        createOpportunity
    );

router.route('/:id')
    .get(optionalAuth, getOpportunity)
    .put(
        protect,
        authorize('admin', 'partner'),
        [
            check('title', 'Title is required').optional().not().isEmpty(),
            check('status', 'Invalid status').optional().isIn(['active', 'inactive', 'draft'])
        ],
        validate,
        updateOpportunity
    )
    .delete(protect, authorize('admin', 'partner'), deleteOpportunity);

module.exports = router;
