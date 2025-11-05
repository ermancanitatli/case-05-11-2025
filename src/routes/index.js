// Author: Erman CANITATLI
// API route registry.
'use strict';

const { Router } = require('express');
const router = Router();
const authRoutes = require('./auth');
const userRoutes = require('./users');
const conversationRoutes = require('./conversations');
const messageRoutes = require('./messages');
const onlineRoutes = require('./online');
const searchRoutes = require('./search');
const docsRoutes = require('./openapi');

// Simple health endpoint.
router.get('/health', (req, res) => {
  res.json({ success: true, data: { status: 'ok', uptime: process.uptime() } });
});

router.use('/auth', authRoutes);
router.use('/user', userRoutes);
router.use('/conversations', conversationRoutes);
router.use('/', messageRoutes);
router.use('/online', onlineRoutes);
router.use('/search', searchRoutes);
router.use('/', docsRoutes);

module.exports = router;
