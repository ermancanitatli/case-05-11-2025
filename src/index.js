// Author: Erman CANITATLI
// Boots the HTTP server and realtime stack.
'use strict';

const http = require('http');
const config = require('./config');
const createApp = require('./app');
const logger = require('./utils/logger');
const { connectDB, disconnectDB } = require('./lib/db');
const { connectRedis, disconnectRedis } = require('./lib/redis');
const { closeMQ } = require('./lib/mq');
const { setup: setupSocket } = require('./realtime/socket');
const messageConsumer = require('./workers/messageConsumer');
const autoMessagePlanner = require('./jobs/autoMessagePlanner');
const monitoring = require('./lib/monitoring');

// Starts HTTP server and background workers.
async function bootstrap() {
  const app = createApp();
  const server = http.createServer(app);
  const io = setupSocket(server);

  try {
    await connectDB();
    await connectRedis();
  } catch (err) {
    logger.error('Uygulama başlatılamadı (DB)', { error: err.message });
    process.exitCode = 1;
    return;
  }

  server.listen(config.port, () => {
    logger.info(`HTTP server dinlemede`, { port: config.port, env: config.env });
  });

  try {
    await messageConsumer.start();
  } catch (e) {}
  try {
    autoMessagePlanner.start();
  } catch (e) {}

  const shutdown = async (signal) => {
    logger.info('Kapanış başlatılıyor', { signal });
    server.close(async () => {
      try {
        await Promise.allSettled([
          disconnectDB(),
          disconnectRedis(),
          closeMQ()
        ]);
      } finally {
        logger.info('Kapanış tamamlandı');
        process.exit(0);
      }
    });
  };

  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));
}

monitoring.init();
bootstrap();
