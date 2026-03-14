const express = require('express');
const {
    createOrganization,
    getOrganizations,
    getOrganization,
    updateOrganization,
    deleteOrganization
} = require('../controllers/organizationController');
const { protect, authorize } = require('../middleware/auth');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const router = express.Router();
const { check } = require('express-validator');
const validate = require('../middleware/validate');

// Optional auth middleware allows public requests to proceed without error,
// but sets req.user if token is valid. Needed for getOrganizations.
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
        // If token fails, treat as public
        next();
    }
};

router.route('/')
    .get(optionalAuth, getOrganizations)
    .post(
        protect,
        authorize('admin', 'partner'),
        [
            check('name', 'Name is required').not().isEmpty(),
            check('description', 'Description is required').not().isEmpty(),
        ],
        validate,
        createOrganization
    );

router.route('/:id')
    .get(optionalAuth, getOrganization)
    .put(
        protect,
        authorize('admin', 'partner'),
        [
            check('name', 'Name is required').optional().not().isEmpty(),
            check('status', 'Invalid status').optional().isIn(['active', 'inactive', 'draft']),
        ],
        validate,
        updateOrganization
    )
    .delete(protect, authorize('admin', 'partner'), deleteOrganization);

module.exports = router;
