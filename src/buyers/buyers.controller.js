const buyersService = require('./buyers.service');
const { asyncHandler } = require('../utils/errorHandler');
const { validateBuyer, validateBuyerUpdate } = require('../utils/validation');

const createBuyer = asyncHandler(async (req, res) => {
  const validatedData = validateBuyer(req.body);
  const buyer = await buyersService.createBuyer(validatedData, req.user.userId);
  res.status(201).json({ success: true, data: buyer });
});

const getBuyers = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, search, city, propertyType, status, timeline, sortBy, sortOrder } = req.query;
  
  const filters = { search, city, propertyType, status, timeline };
  const result = await buyersService.getBuyers(filters, page, limit, sortBy, sortOrder);
  
  res.json({ success: true, ...result });
});

const getBuyerById = asyncHandler(async (req, res) => {
  const result = await buyersService.getBuyerById(req.params.id, req.user.userId);
  res.json({ success: true, ...result });
});

const updateBuyer = asyncHandler(async (req, res) => {
  const validatedData = validateBuyerUpdate(req.body);
  const buyer = await buyersService.updateBuyer(req.params.id, validatedData, req.user.userId);
  res.json({ success: true, data: buyer });
});

const deleteBuyer = asyncHandler(async (req, res) => {
  await buyersService.deleteBuyer(req.params.id, req.user.userId);
  res.json({ success: true, message: 'Buyer deleted successfully' });
});

const importCSV = asyncHandler(async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'CSV file is required' });
  }
  
  const result = await buyersService.importCSV(req.file.buffer, req.user.userId);
  res.json({ success: true, ...result });
});

const exportCSV = asyncHandler(async (req, res) => {
  const { search, city, propertyType, status, timeline, sortBy, sortOrder } = req.query;
  const filters = { search, city, propertyType, status, timeline };
  
  const csvData = await buyersService.exportCSV(filters, sortBy, sortOrder);
  
  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename=buyers.csv');
  res.send(csvData);
});

const getBuyerHistory = asyncHandler(async (req, res) => {
  const history = await buyersService.getBuyerHistory(req.params.id, req.user.userId);
  res.json({ success: true, data: history });
});

module.exports = {
  createBuyer,
  getBuyers,
  getBuyerById,
  updateBuyer,
  deleteBuyer,
  importCSV,
  exportCSV,
  getBuyerHistory
};