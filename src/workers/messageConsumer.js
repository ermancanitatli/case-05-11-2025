'use strict';

const { connectMQ, getChannel } = require('../lib/mq');
const config = require('../config');
const { Conversation, Message, AutoMessage } = require('../models');
const { Types } = require('mongoose');
const { getIO } = require('../realtime/io');

let consumerTag = null;

function getDeathCount(msg, queueName) {
  const h = (msg.properties && msg.properties.headers) || {};
  const deaths = h['x-death'] || [];
  const item = Array.isArray(deaths) ? deaths.find((d) => d && d.queue === queueName) : null;
  return item && item.count ? Number(item.count) : 0;
}

async function handleTask(task) {
  const senderId = new Types.ObjectId(task.senderId);
  const receiverId = new Types.ObjectId(task.receiverId);
  let conv = await Conversation.findOne({ type: 'direct', participants: { $all: [senderId, receiverId] }, isDeleted: false });
  if (!conv) conv = await Conversation.create({ participants: [senderId, receiverId], type: 'direct' });
  const msg = await Message.create({ conversationId: conv._id, senderId, content: String(task.content), status: 'sent' });
  await Conversation.findByIdAndUpdate(conv._id, { lastMessageAt: msg.createdAt, updatedAt: new Date() });
  if (task.autoMessageId && Types.ObjectId.isValid(String(task.autoMessageId))) {
    await AutoMessage.findByIdAndUpdate(task.autoMessageId, { isSent: true, sentAt: new Date() }).withDeleted();
  }
  const io = getIO();
  if (io) io.to(`conversation:${String(conv._id)}`).emit('message_received', msg.toJSON());
}

async function start() {
  await connectMQ();
  const ch = getChannel();
  const q = config.rabbitmq.queues.messageSend;
  const dlq = config.rabbitmq.queues.dlq;
  const tag = await ch.consume(q, async (msg) => {
    if (!msg) return;
    try {
      const data = JSON.parse(msg.content.toString('utf8'));
      if (!data || data.type !== 'AUTO_MESSAGE_SEND') throw new Error('INVALID_TASK');
      await handleTask(data);
      ch.ack(msg);
    } catch (e) {
      const deaths = getDeathCount(msg, q);
      if (deaths >= 3) {
        ch.sendToQueue(dlq, msg.content, { contentType: msg.properties.contentType || 'application/json', persistent: true });
        ch.ack(msg);
      } else {
        ch.nack(msg, false, false);
      }
    }
  });
  consumerTag = tag && tag.consumerTag ? tag.consumerTag : null;
}

async function stop() {
  const ch = getChannel();
  if (ch && consumerTag) {
    await ch.cancel(consumerTag);
    consumerTag = null;
  }
}

module.exports = { start, stop };

