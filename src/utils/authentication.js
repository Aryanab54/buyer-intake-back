const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const nodemailer = require('nodemailer');

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
const JWT_EXPIRES_IN = '7d';

// Simple in-memory store for magic links (use Redis in production)
const magicLinks = new Map();

const generateMagicLink = (email) => {
  const token = crypto.randomBytes(32).toString('hex');
  const expires = Date.now() + (process.env.NODE_ENV === 'development' ? 60 * 60 * 1000 : 15 * 60 * 1000); // 1 hour in dev, 15 minutes in prod
  
  magicLinks.set(token, { email, expires });
  
  return token;
};

const verifyMagicLink = (token) => {
  const link = magicLinks.get(token);
  
  if (!link || Date.now() > link.expires) {
    magicLinks.delete(token);
    return null;
  }
  
  magicLinks.delete(token);
  return link.email;
};

const generateJWT = (userId, email) => {
  return jwt.sign(
    { userId, email },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );
};

const verifyJWT = (token) => {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    return null;
  }
};

const authMiddleware = (req, res, next) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  
  if (!token) {
    // Development fallback
    if (process.env.NODE_ENV === 'development') {
      req.user = { userId: 'dev-user', email: 'dev@example.com' };
      return next();
    }
    return res.status(401).json({ error: 'No token provided' });
  }
  
  const decoded = verifyJWT(token);
  if (!decoded) {
    return res.status(401).json({ error: 'Invalid token' });
  }
  
  req.user = decoded;
  next();
};

const sendMagicLink = async (email, token) => {
  // Demo implementation - in production use proper email service
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: false,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  });
  
  const magicUrl = `${process.env.FRONTEND_URL}/auth/verify?token=${token}`;
  
  await transporter.sendMail({
    from: process.env.EMAIL_USER,
    to: email,
    subject: 'Login to Buyer Lead App',
    html: `<p>Click <a href="${magicUrl}">here</a> to login. Link expires in 15 minutes.</p>`
  });
};

module.exports = {
  generateMagicLink,
  verifyMagicLink,
  generateJWT,
  verifyJWT,
  authMiddleware,
  sendMagicLink
};