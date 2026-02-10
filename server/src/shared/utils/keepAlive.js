const axios = require('axios');
const logger = require('./logger');

const keepAlive = () => {
  // Only run if we have a backend URL
  const backendUrl = process.env.BACKEND_URL || 'http://localhost:3001';
  
  if (!backendUrl) {
    logger.warn('Keep-Alive: BACKEND_URL not set, skipping self-ping.');
    return;
  }

  const pingUrl = `${backendUrl}/health`;

  // Ping every 14 minutes (840000 ms)
  // Render free tier sleeps after 15 mins of inactivity
  const INTERVAL = 14 * 60 * 1000; 

  logger.info(`Keep-Alive: Service started. Pinging ${pingUrl} every 14 minutes.`);

  // Initial ping after 1 min to verify
  setTimeout(() => ping(pingUrl), 60000);

  // Interval ping
  setInterval(() => {
    ping(pingUrl);
  }, INTERVAL);
};

const ping = async (url) => {
  try {
    const start = Date.now();
    await axios.get(url);
    const duration = Date.now() - start;
    logger.info(`Keep-Alive: Ping successful (${duration}ms)`);
  } catch (error) {
    logger.error('Keep-Alive: Ping failed', {
      message: error.message,
      url: url
    });
  }
};

module.exports = keepAlive;
