'use strict';

const { Router } = require('express');
const router = Router();
const auth = require('../middlewares/auth');
const search = require('../services/search');

router.get('/messages', auth, async (req, res) => {
  try {
    const q = String(req.query.q || '').trim();
    if (!q) return res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'Invalid query' } });
    const page = Math.max(1, parseInt(req.query.page || '1', 10));
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit || '20', 10)));
    const offset = (page - 1) * limit;
    const { items, total } = await search.searchMessages(q, { limit, offset });
    return res.json({ success: true, data: { items, page, limit, total } });
  } catch (e) {
    return res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Internal Server Error' } });
  }
});

module.exports = router;

