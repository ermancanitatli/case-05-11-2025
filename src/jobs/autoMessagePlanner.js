'use strict';

const { User, AutoMessage } = require('../models');
const { getRedis } = require('../lib/redis');
const { enqueueAutoMessageTask } = require('../services/queue');

function ymd(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const da = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${da}`;
}

function randInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const t = arr[i];
    arr[i] = arr[j];
    arr[j] = t;
  }
  return arr;
}

function randomContent() {
  const pool = [
    'Merhaba',
    'Günaydın',
    'Nasılsın?',
    'İyi çalışmalar',
    'Selam',
    'Ne haber?',
    'Hoş geldin',
    'Görüşürüz',
    'Bugün nasılsın?',
    'Harika bir gün olsun'
  ];
  return pool[randInt(0, pool.length - 1)];
}

function randomFutureDate() {
  const now = Date.now();
  const min = 10 * 60 * 1000;
  const max = 20 * 60 * 60 * 1000;
  const ms = randInt(min, max);
  return new Date(now + ms);
}

async function planOnce() {
  const users = await User.find({ isActive: true, isDeleted: false }).select('_id').lean();
  if (!users || users.length < 2) return 0;
  const ids = shuffle(users.map((u) => String(u._id)));
  const docs = [];
  for (let i = 0; i + 1 < ids.length; i += 2) {
    const senderId = ids[i];
    const receiverId = ids[i + 1];
    docs.push({ senderId, receiverId, content: randomContent(), sendDate: randomFutureDate() });
  }
  if (docs.length === 0) return 0;
  const result = await AutoMessage.insertMany(docs);
  return result.length;
}

async function minuteQueueJob() {
  while (true) {
    const doc = await AutoMessage.findOneAndUpdate(
      { isQueued: false, isSent: false, isDeleted: false, sendDate: { $lte: new Date() } },
      { isQueued: true, queuedAt: new Date() },
      { sort: { sendDate: 1 }, returnDocument: 'after' }
    );
    if (!doc) break;
    await enqueueAutoMessageTask({ autoMessageId: doc._id, senderId: doc.senderId, receiverId: doc.receiverId, content: doc.content });
  }
}

async function dailyPlannerJob() {
  const r = getRedis();
  const key = 'cron:planner:last';
  const today = ymd(new Date());
  const last = await r.get(key);
  if (last === today) return;
  const now = new Date();
  if (now.getHours() === 2 && now.getMinutes() === 0) {
    await planOnce();
    await r.set(key, today, 'EX', 86400);
  }
}

function start() {
  setInterval(dailyPlannerJob, 30000);
  setInterval(minuteQueueJob, 60000);
}

module.exports = { start };

