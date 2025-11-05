'use strict';

const { Router } = require('express');
const router = Router();
const { User } = require('../models');
const { hashPassword, verifyPassword } = require('../utils/password');
const { sign } = require('../utils/jwt');
const config = require('../config');
const auth = require('../middlewares/auth');
const { issue, verify: verifyRefresh, rotate, revoke } = require('../services/refreshTokens');
const { parseDurationToSeconds } = require('../utils/time');
const { auth: v } = require('../validation/schemas');
const { authLimiter } = require('../middlewares/rateLimit');

function validateEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email || ''));
}

router.post('/register', authLimiter, v.register, async (req, res) => {
  try {
    const { username, email, password } = req.body || {};
    if (!username || !email || !password) return res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'Invalid input' } });
    if (!validateEmail(email)) return res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'Invalid email' } });
    const exists = await User.findOne({ $or: [{ email }, { username }] }).withDeleted();
    if (exists) return res.status(409).json({ success: false, error: { code: 'DUPLICATE', message: 'User exists' } });
    const passwordHash = hashPassword(password);
    const user = await User.create({ username, email, passwordHash });
    return res.json({ success: true, data: { id: String(user._id) } });
  } catch (e) {
    return res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Internal Server Error' } });
  }
});

router.post('/login', authLimiter, v.login, async (req, res) => {
  try {
    const { email, password } = req.body || {};
    if (!email || !password) return res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'Invalid input' } });
    const user = await User.findOne({ email }).select('+passwordHash');
    if (!user || !verifyPassword(password, user.passwordHash) || user.isDeleted || !user.isActive) {
      return res.status(401).json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Unauthorized' } });
    }
    const accessExp = parseDurationToSeconds(config.jwt.accessExpiresIn) || 900;
    const accessToken = sign({ sub: String(user._id) }, config.jwt.accessSecret, accessExp);
    const refreshToken = await issue(String(user._id));
    return res.json({ success: true, data: { accessToken, refreshToken, tokenType: 'Bearer', expiresIn: accessExp } });
  } catch (e) {
    return res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Internal Server Error' } });
  }
});

router.post('/refresh', authLimiter, v.refresh, async (req, res) => {
  try {
    const { refreshToken } = req.body || {};
    if (!refreshToken) return res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'Invalid input' } });
    const userId = await verifyRefresh(refreshToken);
    if (!userId) return res.status(401).json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Unauthorized' } });
    const accessExp = parseDurationToSeconds(config.jwt.accessExpiresIn) || 900;
    const accessToken = sign({ sub: String(userId) }, config.jwt.accessSecret, accessExp);
    const newRefreshToken = await rotate(refreshToken, String(userId));
    return res.json({ success: true, data: { accessToken, refreshToken: newRefreshToken, tokenType: 'Bearer', expiresIn: accessExp } });
  } catch (e) {
    return res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Internal Server Error' } });
  }
});

router.post('/logout', authLimiter, v.logout, async (req, res) => {
  try {
    const { refreshToken } = req.body || {};
    if (refreshToken) await revoke(refreshToken);
    return res.json({ success: true });
  } catch (e) {
    return res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Internal Server Error' } });
  }
});

router.get('/me', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Not found' } });
    return res.json({ success: true, data: user.toJSON() });
  } catch (e) {
    return res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Internal Server Error' } });
  }
});

module.exports = router;
