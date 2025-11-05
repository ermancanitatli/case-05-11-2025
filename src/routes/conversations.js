// Author: Erman CANITATLI
// Conversation listing and details.
'use strict';

const { Router } = require('express');
const router = Router();
const auth = require('../middlewares/auth');
const { Conversation } = require('../models');
const { Types } = require('mongoose');
const { conversations: v } = require('../validation/schemas');

router.get('/', auth, v.list, async (req, res) => {
  try {
    const userId = new Types.ObjectId(req.user.id);
    const page = Math.max(1, parseInt(req.query.page || '1', 10));
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit || '20', 10)));
    const pipeline = [
      { $match: { participants: userId, isDeleted: false } },
      { $sort: { updatedAt: -1 } },
      { $skip: (page - 1) * limit },
      { $limit: limit },
      { $lookup: { from: 'messages', let: { cid: '$_id' }, pipeline: [
        { $match: { $expr: { $and: [ { $eq: ['$conversationId', '$$cid'] }, { $eq: ['$isDeleted', false] } ] } } },
        { $sort: { createdAt: -1 } },
        { $limit: 1 }
      ], as: 'lastMsg' } },
      { $addFields: { lastMessage: { $arrayElemAt: ['$lastMsg', 0] } } },
      { $lookup: { from: 'messages', let: { cid: '$_id' }, pipeline: [
        { $match: { $expr: { $and: [ { $eq: ['$conversationId', '$$cid'] }, { $ne: ['$senderId', userId] }, { $eq: ['$readAt', null] }, { $eq: ['$isDeleted', false] } ] } } },
        { $count: 'count' }
      ], as: 'unread' } },
      { $addFields: { unreadCount: { $ifNull: [ { $arrayElemAt: ['$unread.count', 0] }, 0 ] } } },
      { $project: { lastMsg: 0, unread: 0 } }
    ];
    const [items, total] = await Promise.all([
      Conversation.aggregate(pipeline),
      Conversation.countDocuments({ participants: userId, isDeleted: false })
    ]);
    return res.json({ success: true, data: { items, page, limit, total } });
  } catch (e) {
    return res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Internal Server Error' } });
  }
});

router.get('/:id', auth, v.detail, async (req, res) => {
  try {
    const id = req.params.id;
    if (!Types.ObjectId.isValid(id)) return res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'Invalid id' } });
    const userId = new Types.ObjectId(req.user.id);
    const conv = await Conversation.findOne({ _id: id, participants: userId, isDeleted: false });
    if (!conv) return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Not found' } });
    const detail = await Conversation.aggregate([
      { $match: { _id: new Types.ObjectId(id) } },
      { $lookup: { from: 'messages', let: { cid: '$_id' }, pipeline: [
        { $match: { $expr: { $and: [ { $eq: ['$conversationId', '$$cid'] }, { $eq: ['$isDeleted', false] } ] } } },
        { $sort: { createdAt: -1 } },
        { $limit: 1 }
      ], as: 'lastMsg' } },
      { $addFields: { lastMessage: { $arrayElemAt: ['$lastMsg', 0] } } },
      { $lookup: { from: 'messages', let: { cid: '$_id' }, pipeline: [
        { $match: { $expr: { $and: [ { $eq: ['$conversationId', '$$cid'] }, { $ne: ['$senderId', userId] }, { $eq: ['$readAt', null] }, { $eq: ['$isDeleted', false] } ] } } },
        { $count: 'count' }
      ], as: 'unread' } },
      { $addFields: { unreadCount: { $ifNull: [ { $arrayElemAt: ['$unread.count', 0] }, 0 ] } } },
      { $project: { lastMsg: 0, unread: 0 } }
    ]);
    return res.json({ success: true, data: detail[0] || conv.toJSON() });
  } catch (e) {
    return res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Internal Server Error' } });
  }
});

module.exports = router;
