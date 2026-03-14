const express = require('express');
const {
    submitApplication,
    getApplications,
    getApplication,
    getMyApplications,
    updateApplicationStatus
} = require('../controllers/applicationController');
const { protect, authorize } = require('../middleware/auth');

const { check } = require('express-validator');
const validate = require('../middleware/validate');

const router = express.Router();

router.post('/', [
    protect,
    check('submissionData', 'Submission data is required').not().isEmpty(),
    check('submissionData.organization.name', 'Organization name is required').not().isEmpty(),
    check('submissionData.representative.email', 'Valid representative email is required').isEmail()
], validate, submitApplication);

router.get('/', protect, authorize('admin'), getApplications);
router.get('/mine', protect, getMyApplications);
router.get('/:id', protect, getApplication);

router.patch('/:id/status', [
    protect,
    authorize('admin'),
    check('status', 'Status is required').not().isEmpty(),
    check('status', 'Invalid status').isIn(['approved', 'rejected', 'pending'])
], validate, updateApplicationStatus);

module.exports = router;
