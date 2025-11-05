'use strict';

require('dotenv').config();

const config = {
  env: process.env.NODE_ENV || 'development',
  isProd: (process.env.NODE_ENV || 'development') === 'production',
  port: Number(process.env.PORT || 3000),
  mongo: {
    uri: process.env.MONGODB_URI || 'mongodb://localhost:27017/realtime'
  },
  jwt: {
    accessSecret: process.env.JWT_ACCESS_SECRET || 'dev-access-secret',
    refreshSecret: process.env.JWT_REFRESH_SECRET || 'dev-refresh-secret',
    accessExpiresIn: process.env.JWT_ACCESS_EXPIRES_IN || '15m',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d'
  },
  redis: {
    url: process.env.REDIS_URL || 'redis://localhost:6379'
  },
  rabbitmq: {
    url: process.env.RABBITMQ_URL || 'amqp://localhost:5672',
    dlx: 'dlx',
    queues: {
      messageSend: 'message_sending_queue',
      retry: 'message_sending_queue.retry',
      dlq: 'message_sending_queue.dlq'
    },
    retryTtl: Number(process.env.MQ_RETRY_TTL || 10000)
  },
  rateLimit: {
    windowMs: Number(process.env.RATE_LIMIT_WINDOW_MS || 60000),
    max: Number(process.env.RATE_LIMIT_MAX || 100),
    authMax: Number(process.env.RATE_LIMIT_AUTH_MAX || 10)
  }
};

module.exports = config;
