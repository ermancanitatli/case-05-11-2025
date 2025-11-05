'use strict';

const Redis = require('ioredis');
const config = require('../config');
const logger = require('../utils/logger');

let client;

function getRedis() {
  if (!client) {
    client = new Redis(config.redis.url);
  }
  return client;
}

async function connectRedis() {
  const c = getRedis();
  if (c.status === 'ready' || c.status === 'connecting') return c;
  try {
    await c.connect();
    logger.info('Redis connected', { url: config.redis.url });
    return c;
  } catch (err) {
    logger.error('Redis connection failed', { error: err.message });
    throw err;
  }
}

async function disconnectRedis() {
  if (!client) return;
  try {
    await client.quit();
    logger.info('Redis disconnected');
  } catch (err) {
    logger.warn('Redis disconnect error', { error: err.message });
  }
}

module.exports = { getRedis, connectRedis, disconnectRedis };
