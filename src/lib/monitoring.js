// Author: Erman CANITATLI
// Tiny Sentry wrapper.
'use strict';

const Sentry = require('@sentry/node');
const dsn = process.env.SENTRY_DSN || '';
let initialized = false;

// Initializes Sentry once.
function init() {
  if (!dsn || initialized) return;
  Sentry.init({ dsn });
  initialized = true;
}

// Captures an error when enabled.
function capture(err) {
  if (!initialized) return;
  Sentry.captureException(err);
}

module.exports = { init, capture };
