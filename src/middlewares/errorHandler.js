// Author: Erman CANITATLI
// Express error handler.
'use strict';

const logger = require('../utils/logger');
const monitoring = require('../lib/monitoring');

// Normalizes errors to { success: false, error }.
function errorHandler(err, req, res, next) {
  const status = err.status || err.statusCode || 500;
  const code = err.code || 'INTERNAL_ERROR';
  const message = status >= 500 ? 'Internal Server Error' : err.message || 'Request failed';

  logger.error('Request error', { status, code, message, path: req.path });
  try { monitoring.capture(err); } catch {}
  res.status(status).json({ success: false, error: { code, message } });
}

module.exports = errorHandler;
