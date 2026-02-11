const jwt = require('jsonwebtoken');
const authService = require('../../modules/auth/auth.service');
const logger = require('../utils/logger');

/**
 * JWT Authentication Middleware
 * Protects routes that require authentication
 */
const authMiddleware = async (req, res, next) => {
  try {
    // Get token from Authorization header
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'NO_TOKEN',
          message: 'No authentication token provided'
        }
      });
    }

    const token = authHeader.split(' ')[1];

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Get user details
      const user = await authService.getUserById(decoded.id);

      // Validate role
      if (!['ADMIN', 'USER'].includes(user.role)) {
        return res.status(403).json({
          success: false,
          error: {
            code: 'INVALID_ROLE',
            message: 'Invalid user role'
          }
        });
      }

      // Attach user to request object
      // Convert to plain object to avoid Mongoose document issues (like stringification of populated fields)
      req.user = user.toObject();
    
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        error: {
          code: 'INVALID_TOKEN',
          message: 'Invalid authentication token'
        }
      });
    }

    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        error: {
          code: 'TOKEN_EXPIRED',
          message: 'Authentication token has expired'
        }
      });
    }

    next(error);
  }
};

module.exports = authMiddleware;
