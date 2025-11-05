// Author: Erman CANITATLI
// Thin wrapper to enqueue auto-message tasks.
'use strict';

const config = require('../config');
const { publishToQueue } = require('../lib/mq');

// Enqueues an auto-message to the main queue.
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
