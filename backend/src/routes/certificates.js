const express = require('express');
const { generateCertificate, verifyCertificate } = require('../controllers/certificateController');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.get('/:courseId', protect, generateCertificate);
router.get('/verify/:certificateId', verifyCertificate);

module.exports = router;
