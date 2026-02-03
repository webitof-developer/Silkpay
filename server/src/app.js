require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const rateLimit = require('express-rate-limit');

const connectDB = require('./shared/config/database');
const logger = require('./shared/utils/logger');
const errorHandler = require('./shared/middleware/errorHandler');

const app = express();

// Security Middleware
app.use(helmet());
app.use(mongoSanitize());

// Trust first proxy (e.g., Nginx, Heroku, Vercel)
app.set('trust proxy', 1);

// CORS - Parse multiple origins from environment
const corsOrigins = process.env.CORS_ORIGINS 
  ? process.env.CORS_ORIGINS.split(',').map(origin => origin.trim())
  : ['http://localhost:3000'];

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, Postman, curl, etc.)
    if (!origin) return callback(null, true);
    
    // Check if origin is in whitelist
    if (corsOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Body Parser
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Rate Limiting - General API protection
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: process.env.NODE_ENV === 'production' ? 100 : 1000, // Stricter in production
  standardHeaders: true,
  legacyHeaders: false,
  message: 'Too many requests from this IP, please try again later',
  skip: (req) => req.path === '/health' // Don't rate limit health checks
});
app.use('/api/', limiter);

// Auth-specific rate limiting (stricter for login/password reset)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 15, // Only 5 attempts per 15 minutes
  skipSuccessfulRequests: true, // Don't count successful logins
  message: 'Too many login attempts, please try again later'
});
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/forgot-password', authLimiter);

// Request ID (for tracing)
const requestId = require('./shared/middleware/requestId');
app.use(requestId);

// Request Logging with Response Time
app.use((req, res, next) => {
  const start = Date.now();
  
  // Log when response finishes
  res.on('finish', () => {
    const duration = Date.now() - start;
    const logData = {
      requestId: req.id,
      method: req.method,
      path: req.path,
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      ip: req.ip,
      userAgent: req.get('user-agent')
    };

    // Warn on slow requests (>1 second)
    if (duration > 1000) {
      logger.warn('Slow request detected', logData);
    } else {
      logger.info('Request completed', logData);
    }
  });
  
  next();
});

// Health Check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

//check
app.get('/', (req, res) => {
  res.status(200).send("BACKEND working");
});

// API Routes
app.use('/api/auth', require('./modules/auth').routes);
app.use('/api/merchant', require('./modules/merchant').routes);
app.use('/api/beneficiaries', require('./modules/beneficiary').routes);
app.use('/api/payouts', require('./modules/payout').routes);
app.use('/api/transactions', require('./modules/transaction').routes);
app.use('/api/dashboard', require('./modules/dashboard').routes);
app.use('/api/balance', require('./modules/balance').routes);
app.use('/api/webhook', require('./modules/webhook').routes);

// 404 Handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: {
      code: 'NOT_FOUND',
      message: `Route ${req.method} ${req.path} not found`
    }
  });
});

// Global Error Handler
app.use(errorHandler);

module.exports = app;
