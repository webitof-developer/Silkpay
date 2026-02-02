const Joi = require('joi');

/**
 * Validate update profile request
 */
exports.validateUpdateProfile = (req, res, next) => {
  const schema = Joi.object({
    name: Joi.string().min(2).max(100),
    mobile: Joi.string().pattern(/^[+]?[0-9]{10,15}$/).messages({
      'string.pattern.base': 'Invalid mobile number format'
    }),
    avatar: Joi.string().uri().allow('').optional(),
    username: Joi.string().min(3).max(30).pattern(/^[a-zA-Z0-9_]+$/).messages({
      'string.pattern.base': 'Username can only contain letters, numbers and underscores'
    })
  }).min(1).messages({
    'object.min': 'At least one field must be provided'
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
 * Validate IP whitelist update
 */
exports.validateWhitelistIPs = (req, res, next) => {
  const schema = Joi.object({
    ips: Joi.array().items(
      Joi.string().ip({ version: ['ipv4', 'ipv6'] }).messages({
        'string.ip': 'Invalid IP address format'
      })
    ).min(1).required().messages({
      'array.min': 'At least one IP address is required',
      'any.required': 'IP addresses array is required'
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
 * Validate change password request
 */
exports.validateChangePassword = (req, res, next) => {
  const schema = Joi.object({
    oldPassword: Joi.string().required().messages({
      'any.required': 'Current password is required'
    }),
    newPassword: Joi.string().min(6).required().messages({
      'string.min': 'New password must be at least 6 characters',
      'any.required': 'New password is required'
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
