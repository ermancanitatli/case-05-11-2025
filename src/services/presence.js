// Author: Erman CANITATLI
// Minimal presence helpers on Redis sets.
'use strict';

const { getRedis } = require('../lib/redis');

const SET_KEY = 'online_users';

// Marks a user as online.
async function addOnline(userId) {
  const r = getRedis();
  await r.sadd(SET_KEY, String(userId));
}

// Removes a user from online set.
async function removeOnline(userId) {
  const r = getRedis();
  await r.srem(SET_KEY, String(userId));
}

// Returns online user count.
async function countOnline() {
  const r = getRedis();
  const n = await r.scard(SET_KEY);
  return n || 0;
}

// Returns online user ids.
async function listOnline() {
  const r = getRedis();
  const list = await r.smembers(SET_KEY);
  return list || [];
}

module.exports = { addOnline, removeOnline, countOnline, listOnline };
