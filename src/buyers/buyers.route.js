const express = require('express');
const router = express.Router();
const buyersController = require('./buyers.controller.js');
const { authMiddleware } = require('../utils/authentication');
const { rateLimitMiddleware } = require('../utils/rateLimiter');
const multer = require('multer');

const upload = multer({ storage: multer.memoryStorage() });

// All routes require authentication
router.use(authMiddleware);

// CRUD operations
router.post('/', rateLimitMiddleware(10, 60000), buyersController.createBuyer);
router.get('/', buyersController.getBuyers);
router.get('/:id', buyersController.getBuyerById);
router.put('/:id', rateLimitMiddleware(10, 60000), buyersController.updateBuyer);
router.delete('/:id', buyersController.deleteBuyer);

// Import/Export
router.post('/import', upload.single('file'), buyersController.importCSV);
router.get('/export/csv', buyersController.exportCSV);

// History
router.get('/:id/history', buyersController.getBuyerHistory);

module.exports = router;