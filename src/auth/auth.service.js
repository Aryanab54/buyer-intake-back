const { generateMagicLink, verifyMagicLink: verifyToken, generateJWT, sendMagicLink: sendEmail } = require('../utils/authentication');
const { createUser, findUserByEmail } = require('../user/user.service');
const { ApiError } = require('../utils/errorHandler');

const sendMagicLink = async (email) => {
  // Generate magic link token
  const token = generateMagicLink(email);
  
  // Send email (in development, just log the token)
  if (process.env.NODE_ENV === 'development') {
    console.log(`Magic link for ${email}: ${process.env.FRONTEND_URL || 'http://localhost:3009'}/auth/verify?token=${token}`);
  } else {
    await sendEmail(email, token);
  }
  
  return { message: 'Magic link sent successfully' };
};

const verifyMagicLink = async (token) => {
  if (!token) {
    throw new ApiError('Token is required', 400);
  }
  
  const email = verifyToken(token);
  
  if (!email) {
    // In development, allow any token and use a default email
    if (process.env.NODE_ENV === 'development') {
      const devEmail = 'dev@example.com';
      let user = await findUserByEmail(devEmail);
      if (!user) {
        user = await createUser(devEmail);
      }
      const jwt = generateJWT(user.id, user.email);
      return { token: jwt, user };
    }
    throw new ApiError('Invalid or expired magic link', 400);
  }
  
  // Find or create user
  let user = await findUserByEmail(email);
  
  if (!user) {
    user = await createUser(email);
  }
  
  // Generate JWT
  const jwt = generateJWT(user.id, user.email);
  
  return {
    token: jwt,
    user
  };
};

module.exports = {
  sendMagicLink,
  verifyMagicLink
};