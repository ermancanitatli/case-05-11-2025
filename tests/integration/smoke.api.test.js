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

test('smoke: health, auth, users, conversations, messages, presence, search', async () => {
  const { app } = ctx;
  const h = await request(app).get('/api/health');
  expect(h.status).toBe(200);

  const emailA = `sm_${Date.now()}@ex.com`;
  const emailB = `sb_${Date.now()}@ex.com`;
  const a = await regLogin(app, emailA);
  await regLogin(app, emailB);

  const me = await request(app).get('/api/auth/me').set('Authorization', `Bearer ${a.accessToken}`);
  expect(me.status).toBe(200);

  const users = await request(app).get('/api/user/list').set('Authorization', `Bearer ${a.accessToken}`);
  expect(users.status).toBe(200);
  const userB = users.body.data.items.find((x) => x.email === emailB);

  const created = await request(app)
    .post('/api/messages')
    .set('Authorization', `Bearer ${a.accessToken}`)
    .send({ toUserId: userB.id, content: 'Hi' });
  expect(created.status).toBe(200);
  const convId = created.body.data.conversationId;

  const convList = await request(app).get('/api/conversations').set('Authorization', `Bearer ${a.accessToken}`);
  expect(convList.status).toBe(200);

  const convDetail = await request(app).get(`/api/conversations/${convId}`).set('Authorization', `Bearer ${a.accessToken}`);
  expect(convDetail.status).toBe(200);

  const msgs = await request(app)
    .get(`/api/conversations/${convId}/messages`)
    .set('Authorization', `Bearer ${a.accessToken}`);
  expect(msgs.status).toBe(200);
  const firstId = msgs.body.data.items[0].id;

  const read = await request(app)
    .post(`/api/messages/${firstId}/read`)
    .set('Authorization', `Bearer ${a.accessToken}`)
    .send();
  expect(read.status).toBe(200);

  const onlineCount = await request(app).get('/api/online/count').set('Authorization', `Bearer ${a.accessToken}`);
  expect(onlineCount.status).toBe(200);

  const onlineList = await request(app).get('/api/online/list').set('Authorization', `Bearer ${a.accessToken}`);
  expect(onlineList.status).toBe(200);

  const search = await request(app)
    .get('/api/search/messages')
    .query({ q: 'Hi' })
    .set('Authorization', `Bearer ${a.accessToken}`);
  expect(search.status).toBe(200);
});

