// Author: Erman CANITATLI
// Mongoose schema: Conversation.
'use strict';

const { Schema, model, Types } = require('mongoose');
const basePlugin = require('./plugins/basePlugin');

const ConversationSchema = new Schema(
  {
    participants: {
      type: [{ type: Types.ObjectId, ref: 'User', required: true }],
      validate: [arr => Array.isArray(arr) && arr.length >= 2, 'At least two participants required']
    },
    type: { type: String, enum: ['direct', 'group'], default: 'direct', index: true },
    lastMessageAt: { type: Date, default: null }
  },
  { timestamps: true }
);

ConversationSchema.index({ participants: 1 });
ConversationSchema.index({ lastMessageAt: 1 });

ConversationSchema.plugin(basePlugin);

module.exports = model('Conversation', ConversationSchema);
