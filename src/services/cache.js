'use strict';

const { getRedis } = require('../lib/redis');

const MAX = 50;
const TTL = 3600;

function key(convId) {
  return `conv:${String(convId)}:messages`;
}

async function addMessage(convId, message) {
  const r = getRedis();
  const payload = JSON.stringify(message);
  const k = key(convId);
  await r.multi().lpush(k, payload).ltrim(k, 0, MAX - 1).expire(k, TTL).exec();
}

async function getRecentMessages(convId, limit) {
  const r = getRedis();
  const k = key(convId);
  const n = Math.min(MAX, Math.max(1, Number(limit || 20)));
  const list = await r.lrange(k, 0, n - 1);
  if (!list || list.length === 0) return [];
  return list.map((s) => {
    try { return JSON.parse(s); } catch { return null; }
  }).filter(Boolean);
}

module.exports = { addMessage, getRecentMessages };

