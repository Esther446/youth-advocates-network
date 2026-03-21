const express = require('express');
const { generateCertificate, verifyCertificate } = require('../controllers/certificateController');
const { protect } = require('../middleware/auth');

const router = express.Router();

// IMPORTANT: /verify/:certificateId must be registered BEFORE /:courseId
// to prevent Express from matching 'verify' as a courseId parameter.
router.get('/verify/:certificateId', verifyCertificate);
router.get('/:courseId', protect, generateCertificate);

module.exports = router;
