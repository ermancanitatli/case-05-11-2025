// Author: Erman CANITATLI
// Online presence endpoints.
'use strict';

const { Router } = require('express');
const router = Router();
const auth = require('../middlewares/auth');
const { countOnline, listOnline } = require('../services/presence');

router.get('/count', auth, async (req, res) => {
  try {
    const count = await countOnline();
    return res.json({ success: true, data: { count } });
  } catch (e) {
    return res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Internal Server Error' } });
  }
});

router.get('/list', auth, async (req, res) => {
  try {
    const items = await listOnline();
    return res.json({ success: true, data: { items } });
  } catch (e) {
    return res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Internal Server Error' } });
  }
});

module.exports = router;
