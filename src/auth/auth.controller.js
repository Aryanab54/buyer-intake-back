const authService = require('./auth.service');
const { asyncHandler } = require('../utils/errorHandler');
const { z } = require('zod');

const loginSchema = z.object({
  email: z.string().email()
});

const verifySchema = z.object({
  token: z.string().min(1)
});

const sendMagicLink = asyncHandler(async (req, res) => {
  const { email } = loginSchema.parse(req.body);
  await authService.sendMagicLink(email);
  res.json({ 
    success: true, 
    message: 'Magic link sent to your email' 
  });
});

const verifyMagicLink = asyncHandler(async (req, res) => {
  const { token } = verifySchema.parse(req.body);
  const result = await authService.verifyMagicLink(token);
  res.json({ 
    success: true, 
    data: result 
  });
});

module.exports = {
  sendMagicLink,
  verifyMagicLink
};