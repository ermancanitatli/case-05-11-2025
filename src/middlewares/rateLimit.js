// Author: Erman CANITATLI
// Rate limiters for API and auth.
'use strict';

const rateLimit = require('express-rate-limit');
const config = require('../config');

const apiLimiter = rateLimit({ windowMs: config.rateLimit.windowMs, max: config.rateLimit.max, standardHeaders: true, legacyHeaders: false });
const authLimiter = rateLimit({ windowMs: config.rateLimit.windowMs, max: config.rateLimit.authMax, standardHeaders: true, legacyHeaders: false });

module.exports = { apiLimiter, authLimiter };
