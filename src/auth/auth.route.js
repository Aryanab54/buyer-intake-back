const express = require('express');
const router = express.Router();
const authController = require('./auth.controller');
const { rateLimitMiddleware } = require('../utils/rateLimiter');

router.post('/login', rateLimitMiddleware(5, 60000), authController.sendMagicLink);
router.post('/verify', authController.verifyMagicLink);

module.exports = router;