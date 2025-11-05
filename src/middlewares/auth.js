// Author: Erman CANITATLI
// Bearer JWT auth middleware.
'use strict';

const config = require('../config');
const { verify } = require('../utils/jwt');
const { User } = require('../models');

// Verifies token and sets req.user.
async function auth(req, res, next) {
  try {
    const authHeader = req.headers['authorization'] || '';
    const parts = authHeader.split(' ');
    if (parts.length !== 2 || parts[0] !== 'Bearer') {
      return res.status(401).json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Unauthorized' } });
    }
    const payload = verify(parts[1], config.jwt.accessSecret);
    const user = await User.findById(payload.sub);
    if (!user || user.isDeleted || !user.isActive) {
      return res.status(401).json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Unauthorized' } });
    }
    req.user = { id: String(user._id) };
    next();
  } catch (e) {
    return res.status(401).json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Unauthorized' } });
  }
}

module.exports = auth;
