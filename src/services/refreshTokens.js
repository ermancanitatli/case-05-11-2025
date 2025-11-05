// Author: Erman CANITATLI
// Opaque refresh tokens on Redis.
'use strict';

const crypto = require('crypto');
const { getRedis } = require('../lib/redis');
const { parseDurationToSeconds } = require('../utils/time');
const config = require('../config');

// Redis key builder for a token.
function key(token) {
  return `refresh:${token}`;
}

// TTL in seconds based on config.
function ttlSeconds() {
  return parseDurationToSeconds(config.jwt.refreshExpiresIn) || 7 * 86400;
}

// Generates a random opaque token.
function generateToken() {
  return crypto.randomBytes(48).toString('base64url');
}

// Issues a new refresh token.
async function issue(userId) {
  const token = generateToken();
  const r = getRedis();
  await r.set(key(token), String(userId), 'EX', ttlSeconds());
  return token;
}

// Looks up a token and returns user id.
async function verify(token) {
  const r = getRedis();
  const userId = await r.get(key(token));
  return userId;
}

// Deletes a token.
async function revoke(token) {
  const r = getRedis();
  await r.del(key(token));
}

// Rotates a token atomically.
async function rotate(oldToken, userId) {
  await revoke(oldToken);
  return issue(userId);
}

module.exports = { issue, verify, revoke, rotate };
