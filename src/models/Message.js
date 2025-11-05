// Author: Erman CANITATLI
// Mongoose schema: Message.
'use strict';

const { Schema, model, Types } = require('mongoose');
const basePlugin = require('./plugins/basePlugin');

const MessageSchema = new Schema(
  {
    conversationId: { type: Types.ObjectId, ref: 'Conversation', required: true, index: true },
    senderId: { type: Types.ObjectId, ref: 'User', required: true, index: true },
    content: { type: String, required: true, trim: true, maxlength: 5000 },
    status: { type: String, enum: ['sent', 'delivered', 'read'], default: 'sent', index: true },
    deliveredAt: { type: Date, default: null },
    readAt: { type: Date, default: null }
  },
  { timestamps: true }
);

MessageSchema.index({ conversationId: 1, createdAt: 1 });

MessageSchema.plugin(basePlugin);

module.exports = model('Message', MessageSchema);
