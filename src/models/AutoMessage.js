// Author: Erman CANITATLI
// Mongoose schema: AutoMessage.
'use strict';

const { Schema, model, Types } = require('mongoose');
const basePlugin = require('./plugins/basePlugin');

const AutoMessageSchema = new Schema(
  {
    senderId: { type: Types.ObjectId, ref: 'User', required: true, index: true },
    receiverId: { type: Types.ObjectId, ref: 'User', required: true, index: true },
    content: { type: String, required: true, trim: true, maxlength: 5000 },
    sendDate: { type: Date, required: true, index: true },
    isQueued: { type: Boolean, default: false, index: true },
    queuedAt: { type: Date, default: null },
    isSent: { type: Boolean, default: false, index: true },
    sentAt: { type: Date, default: null },
    error: { type: String, default: null }
  },
  { timestamps: true }
);

AutoMessageSchema.index({ sendDate: 1, isQueued: 1 });

AutoMessageSchema.plugin(basePlugin);

module.exports = model('AutoMessage', AutoMessageSchema);
