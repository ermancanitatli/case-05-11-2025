'use strict';

const { Router } = require('express');
const router = Router();
const auth = require('../middlewares/auth');
const { Conversation, Message } = require('../models');
const { addMessage, getRecentMessages } = require('../services/cache');
const { messages: v } = require('../validation/schemas');
const search = require('../services/search');
const { Types } = require('mongoose');

router.get('/conversations/:id/messages', auth, v.list, async (req, res) => {
  try {
    const id = req.params.id;
    if (!Types.ObjectId.isValid(id)) return res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'Invalid id' } });
    const userId = new Types.ObjectId(req.user.id);
    const conv = await Conversation.findOne({ _id: id, participants: userId, isDeleted: false });
    if (!conv) return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Not found' } });
    const page = Math.max(1, parseInt(req.query.page || '1', 10));
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit || '20', 10)));
    const sort = String(req.query.sort || 'desc').toLowerCase() === 'asc' ? 1 : -1;
    const before = req.query.before ? new Date(req.query.before) : null;
    const after = req.query.after ? new Date(req.query.after) : null;
    const filter = { conversationId: new Types.ObjectId(id), isDeleted: false };
    if (before && !isNaN(before)) filter.createdAt = { ...(filter.createdAt || {}), $lt: before };
    if (after && !isNaN(after)) filter.createdAt = { ...(filter.createdAt || {}), $gt: after };
    if (!before && !after && sort === -1 && page === 1) {
      const cached = await getRecentMessages(id, limit);
      if (cached && cached.length) {
        const total = await Message.countDocuments({ conversationId: new Types.ObjectId(id), isDeleted: false });
        return res.json({ success: true, data: { items: cached, page, limit, total } });
      }
    }
    const [items, total] = await Promise.all([
      Message.find(filter).sort({ createdAt: sort }).skip((page - 1) * limit).limit(limit),
      Message.countDocuments({ conversationId: new Types.ObjectId(id), isDeleted: false })
    ]);
    return res.json({ success: true, data: { items, page, limit, total } });
  } catch (e) {
    return res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Internal Server Error' } });
  }
});

router.post('/messages', auth, v.create, async (req, res) => {
  try {
    const { conversationId, toUserId, content } = req.body || {};
    if (!content || String(content).trim().length === 0) return res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'Invalid content' } });
    const userId = new Types.ObjectId(req.user.id);
    let convId = null;
    if (conversationId) {
      if (!Types.ObjectId.isValid(conversationId)) return res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'Invalid conversationId' } });
      const conv = await Conversation.findOne({ _id: conversationId, participants: userId, isDeleted: false });
      if (!conv) return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Conversation not found' } });
      convId = conv._id;
    } else if (toUserId) {
      if (!Types.ObjectId.isValid(toUserId)) return res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'Invalid toUserId' } });
      const other = new Types.ObjectId(toUserId);
      let conv = await Conversation.findOne({ type: 'direct', participants: { $all: [userId, other] }, isDeleted: false });
      if (!conv) conv = await Conversation.create({ participants: [userId, other], type: 'direct' });
      convId = conv._id;
    } else {
      return res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'conversationId or toUserId required' } });
    }
    const msg = await Message.create({ conversationId: convId, senderId: userId, content: String(content).trim(), status: 'sent' });
    await Conversation.findByIdAndUpdate(convId, { lastMessageAt: msg.createdAt, updatedAt: new Date() });
    await addMessage(convId, msg.toJSON());
    try { await search.indexMessage(msg.toJSON()); } catch {}
    return res.json({ success: true, data: msg.toJSON() });
  } catch (e) {
    return res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Internal Server Error' } });
  }
});

router.post('/messages/:id/read', auth, v.read, async (req, res) => {
  try {
    const id = req.params.id;
    if (!Types.ObjectId.isValid(id)) return res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'Invalid id' } });
    const msg = await Message.findById(id);
    if (!msg || msg.isDeleted) return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Not found' } });
    const conv = await Conversation.findById(msg.conversationId);
    if (!conv) return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Not found' } });
    const userId = String(req.user.id);
    const isParticipant = conv.participants.map(String).includes(userId);
    if (!isParticipant) return res.status(403).json({ success: false, error: { code: 'FORBIDDEN', message: 'Forbidden' } });
    if (String(msg.senderId) === userId) return res.json({ success: true, data: { id: String(msg._id), status: msg.status, readAt: msg.readAt } });
    if (!msg.readAt) {
      msg.readAt = new Date();
      msg.status = 'read';
      await msg.save();
    }
    return res.json({ success: true, data: { id: String(msg._id), status: msg.status, readAt: msg.readAt } });
  } catch (e) {
    return res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Internal Server Error' } });
  }
});

module.exports = router;
