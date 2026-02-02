/**
 * Environment Variables Validator
 * 
 * Validates all required environment variables at startup
 * Prevents server from starting with missing/invalid configuration
 */

const requiredEnvVars = {
  // Server Configuration
  NODE_ENV: {
    required: true,
    validate: (val) => ['development', 'production', 'test'].includes(val),
    default: 'development'
  },
  PORT: {
    required: true,
    validate: (val) => !isNaN(val) && val > 0 && val < 65536,
    default: '3001'
  },

  // Database
  MONGODB_URI: {
    required: true,
    validate: (val) => val.startsWith('mongodb://') || val.startsWith('mongodb+srv://'),
    error: 'MONGODB_URI must be a valid MongoDB connection string'
  },

  // Security
  JWT_SECRET: {
    required: true,
    validate: (val) => val.length >= 32,
    error: 'JWT_SECRET must be at least 32 characters for security'
  },
  JWT_EXPIRY: {
    required: false,
    default: '30m'
  },
  ENCRYPTION_KEY: {
    required: true,
    validate: (val) => /^[0-9a-fA-F]{64}$/.test(val),
    error: 'ENCRYPTION_KEY must be 64 hex characters (32 bytes for AES-256)'
  },

  // SilkPay API (Optional for initial setup)
  SILKPAY_API_URL: {
    required: false,
    validate: (val) => !val || val.startsWith('http'),
    default: 'https://api.dev.silkpay.ai',
    warning: 'Using default test API URL'
  },
  SILKPAY_MERCHANT_ID: {
    required: false,
    warning: 'SilkPay integration will not work without MERCHANT_ID'
  },
  SILKPAY_SECRET_KEY: {
    required: false,
    warning: 'SilkPay integration will not work without SECRET_KEY'
  },

  // Frontend
  FRONTEND_URL: {
    required: false,
    default: 'http://localhost:3000'
  },
  BACKEND_URL: {
    required: false,
    default: 'http://localhost:3001'
  },
  CORS_ORIGINS: {
    required: false,
    default: 'http://localhost:3000'
  },

  // Email (Optional)
  SMTP_HOST: {
    required: false
  },
  SMTP_PORT: {
    required: false,
    validate: (val) => !val || !isNaN(val)
  },
  SMTP_USER: {
    required: false
  },
  SMTP_PASS: {
    required: false
  },
  EMAIL_FROM: {
    required: false,
    default: 'noreply@silkpay.local'
  }
};

class ValidationError extends Error {
  constructor(message, errors = []) {
    super(message);
    this.name = 'ValidationError';
    this.errors = errors;
  }
}

/**
 * Validate environment variables
 * @throws {ValidationError} if validation fails
 */
function validateEnv() {
  const errors = [];
  const warnings = [];
  const applied = {};

  for (const [key, config] of Object.entries(requiredEnvVars)) {
    const value = process.env[key];

    // Check if required
    if (config.required && !value) {
      errors.push(`Missing required environment variable: ${key}`);
      continue;
    }

    // Apply default if missing
    if (!value && config.default) {
      process.env[key] = config.default;
      applied[key] = config.default;
      
      if (config.warning) {
        warnings.push(`${key}: ${config.warning}`);
      }
      continue;
    }

    // Validate if present
    if (value && config.validate && !config.validate(value)) {
      const errorMsg = config.error || `Invalid value for ${key}: ${value}`;
      errors.push(errorMsg);
      continue;
    }

    // Check for warnings
    if (!value && config.warning) {
      warnings.push(`${key}: ${config.warning}`);
    }
  }

  // Display applied defaults
  if (Object.keys(applied).length > 0) {
    console.log('\n📝 Applied default values:');
    for (const [key, value] of Object.entries(applied)) {
      console.log(`   ${key} = ${value}`);
    }
  }

  // Display warnings
  if (warnings.length > 0) {
    console.log('\n⚠️  Warnings:');
    warnings.forEach(warning => console.log(`   ${warning}`));
  }

  // Throw if errors
  if (errors.length > 0) {
    console.error('\n❌ Environment variable validation failed:\n');
    errors.forEach(error => console.error(`   - ${error}`));
    console.error('\n💡 Please check your .env file and ensure all required variables are set.\n');
    throw new ValidationError('Environment validation failed', errors);
  }

  console.log('\n✅ Environment variables validated\n');
}

/**
 * Get environment-specific configuration
 */
function getConfig() {
  return {
    env: process.env.NODE_ENV,
    port: parseInt(process.env.PORT),
    isDevelopment: process.env.NODE_ENV === 'development',
    isProduction: process.env.NODE_ENV === 'production',
    isTest: process.env.NODE_ENV === 'test',
    
    database: {
      uri: process.env.MONGODB_URI
    },
    
    jwt: {
      secret: process.env.JWT_SECRET,
      expiry: process.env.JWT_EXPIRY
    },
    
    encryption: {
      key: process.env.ENCRYPTION_KEY
    },
    
    silkpay: {
      apiUrl: process.env.SILKPAY_API_URL,
      merchantId: process.env.SILKPAY_MERCHANT_ID,
      secretKey: process.env.SILKPAY_SECRET_KEY,
      isConfigured: !!(process.env.SILKPAY_MERCHANT_ID && process.env.SILKPAY_SECRET_KEY)
    },
    
    frontend: {
      url: process.env.FRONTEND_URL,
      corsOrigins: process.env.CORS_ORIGINS?.split(',').map(o => o.trim()) || [process.env.FRONTEND_URL]
    },
    backend: {
      url: process.env.BACKEND_URL,
      corsOrigins: process.env.CORS_ORIGINS?.split(',').map(o => o.trim()) || [process.env.BACKEND_URL]
    },
    email: {
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT ? parseInt(process.env.SMTP_PORT) : undefined,
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
      from: process.env.EMAIL_FROM,
      isConfigured: !!(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS)
    }
  };
}

module.exports = {
  validateEnv,
  getConfig,
  ValidationError
};
