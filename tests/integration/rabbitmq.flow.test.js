'use strict';

const request = require('supertest');
const { startServer, stopServer } = require('./helpers');
const { enqueueAutoMessageTask } = require('../../src/services/queue');
const messageConsumer = require('../../src/workers/messageConsumer');
const { closeMQ } = require('../../src/lib/mq');

let ctx;

beforeAll(async () => {
  process.env.USE_EXTERNAL_MONGO = 'true';
  ctx = await startServer();
  await messageConsumer.start();
});

afterAll(async () => {
  try { await messageConsumer.stop(); } catch {}
  try { await closeMQ(); } catch {}
  await stopServer(ctx);
});

async function regLogin(app, email) {
  await request(app).post('/api/auth/register').send({ username: email.split('@')[0], email, password: 'Passw0rd!' });
  const r = await request(app).post('/api/auth/login').send({ email, password: 'Passw0rd!' });
  return r.body.data;
}

test('rabbitmq flow: enqueue auto message -> consumed -> appears in conversations', async () => {
  const { app } = ctx;
  const emailA = `mq_${Date.now()}@ex.com`;
  const emailB = `mqb_${Date.now()}@ex.com`;
  const a = await regLogin(app, emailA);
  await regLogin(app, emailB);

  const me = await request(app).get('/api/auth/me').set('Authorization', `Bearer ${a.accessToken}`);
  const users = await request(app).get('/api/user/list').set('Authorization', `Bearer ${a.accessToken}`);
  const userA = me.body.data;
  const userB = users.body.data.items.find((x) => x.email === emailB);

  const content = `auto_${Date.now()}`;
  await enqueueAutoMessageTask({ senderId: userA.id, receiverId: userB.id, content });

  let found = false;
  for (let i = 0; i < 30 && !found; i += 1) {
    const convs = await request(app).get('/api/conversations').set('Authorization', `Bearer ${a.accessToken}`);
    if (convs.status === 200 && Array.isArray(convs.body.data.items)) {
      const hit = convs.body.data.items.find((c) => c.lastMessage && c.lastMessage.content === content);
      if (hit) found = true;
    }
    if (!found) await new Promise((r) => setTimeout(r, 200));
  }
  expect(found).toBe(true);
});

