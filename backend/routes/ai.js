const express = require('express');
const controller = require('../controllers/aiController');

const router = express.Router();

router.post('/analyze-image', controller.analyzeImage);

module.exports = router;

