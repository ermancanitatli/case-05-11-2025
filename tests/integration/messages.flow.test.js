'use strict';

const request = require('supertest');
const { startServer, stopServer } = require('./helpers');

let ctx;

beforeAll(async () => {
  process.env.USE_EXTERNAL_MONGO = 'true';
  ctx = await startServer();
});

afterAll(async () => {
  await stopServer(ctx);
});

async function regLogin(app, email) {
  await request(app).post('/api/auth/register').send({ username: email.split('@')[0], email, password: 'Passw0rd!' });
  const r = await request(app).post('/api/auth/login').send({ email, password: 'Passw0rd!' });
  return r.body.data;
}

test('message flow create/list/read', async () => {
  const { app } = ctx;
  const emailA = `a_${Date.now()}@ex.com`;
  const emailB = `b_${Date.now()}@ex.com`;
  const a = await regLogin(app, emailA);
  await regLogin(app, emailB);
  const me = await request(app).get('/api/auth/me').set('Authorization', `Bearer ${a.accessToken}`);
  const userA = me.body.data;
  const users = await request(app).get('/api/user/list').set('Authorization', `Bearer ${a.accessToken}`);
  const userB = users.body.data.items.find((x) => x.email === emailB);

  const msg1 = await request(app)
    .post('/api/messages')
    .set('Authorization', `Bearer ${a.accessToken}`)
    .send({ toUserId: userB.id, content: 'Hello' });
  expect(msg1.status).toBe(200);
  const convId = msg1.body.data.conversationId;
  const list = await request(app)
    .get(`/api/conversations/${convId}/messages`)
    .set('Authorization', `Bearer ${a.accessToken}`);
  expect(list.status).toBe(200);
  const firstId = list.body.data.items[0].id;
  const read = await request(app)
    .post(`/api/messages/${firstId}/read`)
    .set('Authorization', `Bearer ${a.accessToken}`)
    .send();
  expect(read.status).toBe(200);
});
