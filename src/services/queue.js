'use strict';

const config = require('../config');
const { publishToQueue } = require('../lib/mq');

async function enqueueAutoMessageTask(task) {
  const payload = {
    type: 'AUTO_MESSAGE_SEND',
    autoMessageId: String(task.autoMessageId || ''),
    senderId: String(task.senderId),
    receiverId: String(task.receiverId),
    content: String(task.content)
  };
  await publishToQueue(config.rabbitmq.queues.messageSend, payload);
}

module.exports = { enqueueAutoMessageTask };

