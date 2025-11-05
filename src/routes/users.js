// Author: Erman CANITATLI
// User listing endpoint.
'use strict';

const { Router } = require('express');
const router = Router();
const { User } = require('../models');
const auth = require('../middlewares/auth');
const { users: v } = require('../validation/schemas');

// Lists users with simple pagination.
router.get('/list', auth, v.list, async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page || '1', 10));
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit || '20', 10)));
    const q = String(req.query.q || '').trim();
    const filter = {};
    if (q) filter.$or = [{ username: { $regex: q, $options: 'i' } }, { email: { $regex: q, $options: 'i' } }];
    const [items, total] = await Promise.all([
      User.find(filter).skip((page - 1) * limit).limit(limit).sort({ createdAt: -1 }),
      User.countDocuments(filter)
    ]);
    return res.json({ success: true, data: { items, page, limit, total } });
  } catch (e) {
    return res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Internal Server Error' } });
  }
});

module.exports = router;
