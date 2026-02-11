const Joi = require('joi');

/**
 * Validate create user request
 */
exports.validateCreateUser = (req, res, next) => {
  const schema = Joi.object({
    name: Joi.string().trim().min(1).required().messages({
      'string.empty': 'Name is required',
      'any.required': 'Name is required'
    }),
    email: Joi.string().email({ tlds: { allow: false } }).required().messages({
      'string.email': 'Invalid email format',
      'any.required': 'Email is required'
    }),
    password: Joi.string().min(6).required().messages({
      'string.min': 'Password must be at least 6 characters',
      'any.required': 'Password is required'
    }),
    role: Joi.string().valid('ADMIN', 'USER').default('USER').messages({
      'any.only': 'Role must be either ADMIN or USER'
    }),
    merchant_id: Joi.string().required().messages({
      'any.required': 'Merchant ID is required'
    }),
    username: Joi.string().trim().alphanum().max(30).optional().messages({
      'string.alphanum': 'Username must only contain alpha-numeric characters',
      'string.min': 'Username must be at least 3 characters',
      'string.max': 'Username cannot exceed 30 characters'
    })
  });

  const { error } = schema.validate(req.body);
  
  if (error) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: error.details[0].message
      }
    });
  }

  next();
};

/**
 * Validate update user request
 */
exports.validateUpdateUser = (req, res, next) => {
  const schema = Joi.object({
    name: Joi.string().trim().min(1).optional().messages({
      'string.empty': 'Name cannot be empty'
    }),
    email: Joi.string().email({ tlds: { allow: false } }).optional().messages({
      'string.email': 'Invalid email format'
    }),
    username: Joi.string().trim().alphanum().min(3).max(30).optional().messages({
      'string.alphanum': 'Username must only contain alpha-numeric characters',
      'string.min': 'Username must be at least 3 characters',
      'string.max': 'Username cannot exceed 30 characters'
    }),
    password: Joi.string().min(6).optional().messages({
      'string.min': 'Password must be at least 6 characters'
    }),
    role: Joi.string().valid('ADMIN', 'USER').optional().messages({
      'any.only': 'Role must be either ADMIN or USER'
    }),
    status: Joi.string().valid('ACTIVE', 'INACTIVE').optional().messages({
      'any.only': 'Status must be either ACTIVE or INACTIVE'
    })
  });

  const { error } = schema.validate(req.body);
  
  if (error) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: error.details[0].message
      }
    });
  }

  next();
};

/**
 * Validate user ID parameter
 */
exports.validateUserId = (req, res, next) => {
  const schema = Joi.object({
    id: Joi.string().hex().length(24).required().messages({
      'string.hex': 'Invalid user ID format',
      'string.length': 'Invalid user ID format',
      'any.required': 'User ID is required'
    })
  });

  const { error } = schema.validate(req.params);
  
  if (error) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: error.details[0].message
      }
    });
  }

  next();
};

