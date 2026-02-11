const logger = require('../utils/logger');

/**
 * RBAC Middleware - Protect routes by role
 * Usage: router.get('/path', authenticate, requireRole('ADMIN'), handler)
 */
const requireRole = (roles) => {
  return (req, res, next) => {
    const userRole = req.user?.role;
    
    // Check if user is authenticated
    if (!userRole) {
      logger.warn('RBAC: No role found in request', {
        path: req.path,
        userId: req.user?.id
      });
      
      return res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Authentication required'
        }
      });
    }

    // Normalize roles to array
    const allowedRoles = Array.isArray(roles) ? roles : [roles];
    
    // Check if user has required role
    if (!allowedRoles.includes(userRole)) {
      logger.warn('RBAC: Access denied', {
        user: req.user.email,
        userRole,
        requiredRoles: allowedRoles,
        path: req.path
      });
      
      return res.status(403).json({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: 'Insufficient permissions'
        }
      });
    }

    // User has permission, proceed
    next();
  };
};

module.exports = { requireRole };
