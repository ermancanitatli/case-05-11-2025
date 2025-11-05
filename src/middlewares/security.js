// Author: Erman CANITATLI
// Helmet, CORS and compression presets.
'use strict';

const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');

// Returns security middlewares per environment.
function securityMiddlewares() {
  const env = process.env.NODE_ENV || 'development';
  if (env === 'production') {
    const list = String(process.env.CORS_ORIGINS || '')
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
    const origin = function (o, cb) {
      if (!o) return cb(null, true);
      if (list.length === 0) return cb(null, false);
      return cb(null, list.includes(o));
    };
    return [helmet(), cors({ origin, credentials: true }), compression()];
  }
  return [helmet(), cors({ origin: true, credentials: true }), compression()];
}

module.exports = securityMiddlewares;
