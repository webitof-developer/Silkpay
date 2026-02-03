require('dotenv').config();
const app = require('./src/app');
const connectDB = require('./src/shared/config/database');
const logger = require('./src/shared/utils/logger');

const PORT = process.env.PORT || 3001;

async function startServer() {
  try {
    await connectDB();
    logger.info("✅ DB connected successfully.");

    const server = app.listen(PORT, () => {
      logger.info(`🚀 Server running on port ${PORT}`);
      logger.info(`📡 API available at http://localhost:${PORT}/api`);
    });

    process.on('SIGTERM', () => {
      logger.info('SIGTERM received: shutting down');
      server.close(() => process.exit(0));
    });

    process.on('SIGINT', () => {
      logger.info('SIGINT received: shutting down');
      server.close(() => process.exit(0));
    });

    process.on('unhandledRejection', (err) => {
      logger.error('Unhandled Promise Rejection:', err);
      server.close(() => process.exit(1));
    });

  } catch (err) {
    logger.error('❌ Failed to connect to DB:', err);
    process.exit(1);
  }
}

startServer();
