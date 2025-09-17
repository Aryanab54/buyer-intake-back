const express = require('express');
const router = express.Router();
const userController = require('./user.controller');
const { authMiddleware } = require('../utils/authentication');

// All routes require authentication
router.use(authMiddleware);

router.get('/me', userController.getCurrentUser);
router.put('/me', userController.updateCurrentUser);

module.exports = router;