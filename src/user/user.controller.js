const userService = require('./user.service');
const { asyncHandler } = require('../utils/errorHandler');
const { z } = require('zod');

const updateUserSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  email: z.string().email().optional()
});

const getCurrentUser = asyncHandler(async (req, res) => {
  const user = await userService.getUserById(req.user.userId);
  res.json({ success: true, data: user });
});

const updateCurrentUser = asyncHandler(async (req, res) => {
  const validatedData = updateUserSchema.parse(req.body);
  const user = await userService.updateUser(req.user.userId, validatedData);
  res.json({ success: true, data: user });
});

module.exports = {
  getCurrentUser,
  updateCurrentUser
};