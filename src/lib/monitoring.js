'use strict';

const Sentry = require('@sentry/node');
const dsn = process.env.SENTRY_DSN || '';
let initialized = false;

function init() {
  if (!dsn || initialized) return;
  Sentry.init({ dsn });
  initialized = true;
}

function capture(err) {
  if (!initialized) return;
  Sentry.captureException(err);
}

module.exports = { init, capture };

