'use strict';

const mongoose = require('mongoose');
const config = require('../config');
const logger = require('../utils/logger');

let connected = false;

async function connectDB() {
  if (connected) return mongoose;
  mongoose.set('strictQuery', true);
  try {
    await mongoose.connect(config.mongo.uri, {
      autoIndex: true,
      maxPoolSize: 10
    });
    connected = true;
    logger.info('MongoDB connected', { uri: config.mongo.uri });
    return mongoose;
  } catch (err) {
    logger.error('MongoDB connection failed', { error: err.message });
    throw err;
  }
}

async function disconnectDB() {
  if (!connected) return;
  await mongoose.connection.close();
  connected = false;
  logger.info('MongoDB disconnected');
}

module.exports = { connectDB, disconnectDB };

