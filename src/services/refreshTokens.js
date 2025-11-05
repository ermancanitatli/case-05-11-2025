'use strict';

const crypto = require('crypto');
const { getRedis } = require('../lib/redis');
const { parseDurationToSeconds } = require('../utils/time');
const config = require('../config');

function key(token) {
  return `refresh:${token}`;
}

function ttlSeconds() {
  return parseDurationToSeconds(config.jwt.refreshExpiresIn) || 7 * 86400;
}

function generateToken() {
  return crypto.randomBytes(48).toString('base64url');
}

async function issue(userId) {
  const token = generateToken();
  const r = getRedis();
  await r.set(key(token), String(userId), 'EX', ttlSeconds());
  return token;
}

async function verify(token) {
  const r = getRedis();
  const userId = await r.get(key(token));
  return userId;
}

async function revoke(token) {
  const r = getRedis();
  await r.del(key(token));
}

async function rotate(oldToken, userId) {
  await revoke(oldToken);
  return issue(userId);
}

module.exports = { issue, verify, revoke, rotate };

