// No-op rate limiter for now — disabled per request
// If you want to enable rate limiting again, replace this with express-rate-limit usage.

const authLimiter = (req, res, next) => next();

module.exports = {
  authLimiter,
};