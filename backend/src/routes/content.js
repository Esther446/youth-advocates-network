const express = require('express');
const router = express.Router();
const { getGallery, getImpact } = require('../controllers/contentController');

router.get('/gallery', getGallery);
router.get('/impact', getImpact);

module.exports = router;
