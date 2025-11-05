// Author: Erman CANITATLI
// RabbitMQ channel and helpers.
'use strict';

const amqp = require('amqplib');
const config = require('../config');
const logger = require('../utils/logger');

let connection;
let channel;

// Opens AMQP connection and declares queues.
async function connectMQ() {
  if (channel) return channel;
  try {
    connection = await amqp.connect(config.rabbitmq.url);
    channel = await connection.createChannel();
    await setupQueues();
    logger.info('RabbitMQ connected', { url: config.rabbitmq.url });
    return channel;
  } catch (err) {
    logger.error('RabbitMQ connection failed', { error: err.message });
    throw err;
  }
}

async function setupQueues() {
  await channel.assertExchange(config.rabbitmq.dlx, 'direct', { durable: true });
  await channel.assertQueue(config.rabbitmq.queues.messageSend, {
    durable: true,
    deadLetterExchange: config.rabbitmq.dlx,
    deadLetterRoutingKey: config.rabbitmq.queues.retry
  });
  await channel.assertQueue(config.rabbitmq.queues.retry, {
    durable: true,
    messageTtl: config.rabbitmq.retryTtl,
    deadLetterExchange: config.rabbitmq.dlx,
    deadLetterRoutingKey: config.rabbitmq.queues.messageSend
  });
  await channel.assertQueue(config.rabbitmq.queues.dlq, { durable: true });
  await channel.bindQueue(config.rabbitmq.queues.retry, config.rabbitmq.dlx, config.rabbitmq.queues.retry);
  await channel.bindQueue(config.rabbitmq.queues.messageSend, config.rabbitmq.dlx, config.rabbitmq.queues.messageSend);
  await channel.bindQueue(config.rabbitmq.queues.dlq, config.rabbitmq.dlx, config.rabbitmq.queues.dlq);
}

function getChannel() {
  return channel;
}

// Publishes a JSON message to a queue.
async function publishToQueue(queue, payload, opts = {}) {
  const ch = await connectMQ();
  const body = Buffer.from(JSON.stringify(payload));
  const ok = ch.sendToQueue(queue, body, { contentType: 'application/json', persistent: true, ...opts });
  return ok;
}

// Gracefully closes channel and connection.
async function closeMQ() {
  try {
    if (channel) {
      await channel.close();
      channel = null;
    }
    if (connection) {
      await connection.close();
      connection = null;
    }
    logger.info('RabbitMQ disconnected');
  } catch (err) {
    logger.warn('RabbitMQ disconnect error', { error: err.message });
  }
}

module.exports = { connectMQ, closeMQ, getChannel, publishToQueue };
