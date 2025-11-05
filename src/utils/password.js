// Author: Erman CANITATLI
// Simple scrypt-based password helper.
'use strict';

const crypto = require('crypto');

// Produces a salted scrypt hash.
function hashPassword(password) {
  const salt = crypto.randomBytes(16);
  const pwd = Buffer.from(String(password));
  const key = crypto.scryptSync(pwd, salt, 64);
  const out = Buffer.concat([salt, key]).toString('base64');
  return out;
}

// Verifies a password against stored hash.
function verifyPassword(password, stored) {
  const raw = Buffer.from(String(stored), 'base64');
  const salt = raw.subarray(0, 16);
  const key = raw.subarray(16);
  const pwd = Buffer.from(String(password));
  const newKey = crypto.scryptSync(pwd, salt, key.length);
  return crypto.timingSafeEqual(key, newKey);
}

module.exports = { hashPassword, verifyPassword };
