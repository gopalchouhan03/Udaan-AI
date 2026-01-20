const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Optional auth middleware: if a valid Bearer token is present, attaches req.user.
// If no token or invalid token, does not block the request.
const authOptional = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next();
  }
  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'changeme');
    const user = await User.findById(decoded.id).select('-passwordHash');
    if (user) req.user = user;
  } catch (err) {
    // ignore invalid tokens for optional auth
    console.warn('Optional auth: invalid token');
  }
  return next();
};

module.exports = authOptional;
