const mongoose = require('mongoose');
const logger = require('../utils/logger');

let cached = global.mongooseConnection;

if (!cached) {
  cached = { conn: null, promise: null };
  global.mongooseConnection = cached;
}

async function connectDB() {
  if (cached.conn) {
    return cached.conn;
  }
  if (!cached.promise) {
    cached.promise = mongoose.connect(process.env.MONGODB_URI);
  }
  const conn = await cached.promise;
  cached.conn = conn;

  logger.info(`✅ MongoDB Connected: ${conn.connection.host}`);
  logger.info(`📊 Database: ${conn.connection.name}`);

  mongoose.connection.on('error', (err) => {
    logger.error('MongoDB connection error:', err);
  });
  mongoose.connection.on('disconnected', () => {
    logger.warn('MongoDB disconnected');
  });
  mongoose.connection.on('reconnected', () => {
    logger.info('MongoDB reconnected');
  });

  return conn;
}

module.exports = connectDB;
