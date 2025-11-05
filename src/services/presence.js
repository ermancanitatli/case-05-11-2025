'use strict';

const { getRedis } = require('../lib/redis');

const SET_KEY = 'online_users';

async function addOnline(userId) {
  const r = getRedis();
  await r.sadd(SET_KEY, String(userId));
}

async function removeOnline(userId) {
  const r = getRedis();
  await r.srem(SET_KEY, String(userId));
}

async function countOnline() {
  const r = getRedis();
  const n = await r.scard(SET_KEY);
  return n || 0;
}

async function listOnline() {
  const r = getRedis();
  const list = await r.smembers(SET_KEY);
  return list || [];
}

module.exports = { addOnline, removeOnline, countOnline, listOnline };
