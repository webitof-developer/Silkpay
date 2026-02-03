const { randomUUID } = require('crypto');

/**
 * Request ID Middleware
 * Adds unique ID to each request for tracing through logs
 */
const requestId = (req, res, next) => {
  // Generate unique request ID
  req.id = randomUUID();
  
  // Add to response headers (useful for debugging)
  res.setHeader('X-Request-ID', req.id);
  
  next();
};

module.exports = requestId;
