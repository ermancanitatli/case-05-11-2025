// Author: Erman CANITATLI
// 404 handler for unknown routes.
'use strict';

// Sends a simple 404 JSON payload.
function notFound(req, res) {
  res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Endpoint not found' } });
}

module.exports = notFound;
