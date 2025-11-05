'use strict';

const { startServer, stopServer } = require('../integration/helpers');
const ioClient = require('socket.io-client');
const request = require('supertest');

jest.mock('../../src/lib/redis', () => {
  const store = new Map();
  const lists = new Map();
  function ensureList(k) {
    if (!lists.has(k)) lists.set(k, []);
    return lists.get(k);
  }
  return {
    getRedis: () => ({
      sadd: jest.fn(async () => 1),
      srem: jest.fn(async () => 1),
      scard: jest.fn(async () => 1),
      smembers: jest.fn(async () => []),
      set: jest.fn(async (k, v) => {
        store.set(k, v);
        return 'OK';
      }),
      get: jest.fn(async (k) => store.get(k) || null),
      del: jest.fn(async (k) => (store.delete(k) ? 1 : 0)),
      lrange: jest.fn(async (k, start, stop) => {
        const arr = ensureList(k);
        const end = stop >= 0 ? stop + 1 : undefined;
        return arr.slice(start, end);
      }),
      multi: jest.fn(() => {
        const chain = {
          lpush: (k, v) => {
            const arr = ensureList(k);
            arr.unshift(v);
            lists.set(k, arr);
            return chain;
          },
          ltrim: (k, start, stop) => {
            const arr = ensureList(k);
            const end = stop >= 0 ? stop + 1 : undefined;
            lists.set(k, arr.slice(start, end));
            return chain;
          },
          expire: () => chain,
          exec: async () => []
        };
        return chain;
      })
    }),
    connectRedis: async () => ({}),
    disconnectRedis: async () => {}
  };
});

let ctx;

beforeAll(async () => {
  process.env.USE_EXTERNAL_MONGO = 'true';
  ctx = await startServer(true);
});

afterAll(async () => {
  await stopServer(ctx);
});

async function regLogin(app, email) {
  await request(app).post('/api/auth/register').send({ username: email.split('@')[0], email, password: 'Passw0rd!' });
  const r = await request(app).post('/api/auth/login').send({ email, password: 'Passw0rd!' });
  return r.body.data;
}

test('socket join_room and send_message -> message_received', async () => {
  const { app, baseURL } = ctx;
  const emailA = `sa_${Date.now()}@ex.com`;
  const emailB = `sb_${Date.now()}@ex.com`;
  const a = await regLogin(app, emailA);
  const b = await regLogin(app, emailB);
  const me = await request(app).get('/api/auth/me').set('Authorization', `Bearer ${a.accessToken}`);
  const userA = me.body.data;
  const users = await request(app).get('/api/user/list').set('Authorization', `Bearer ${a.accessToken}`);
  const userB = users.body.data.items.find((x) => x.email === emailB);

  const r = await request(app)
    .post('/api/messages')
    .set('Authorization', `Bearer ${a.accessToken}`)
    .send({ toUserId: userB.id, content: 'seed' });
  const convId = r.body.data.conversationId;

  const c1 = ioClient(baseURL, { auth: { token: a.accessToken }, transports: ['websocket'] });
  const c2 = ioClient(baseURL, { auth: { token: b.accessToken }, transports: ['websocket'] });

  await new Promise((resolve) => c1.on('connect', resolve));
  await new Promise((resolve) => c2.on('connect', resolve));

  await new Promise((resolve) => c1.emit('join_room', { conversationId: convId }, () => resolve()));
  await new Promise((resolve) => c2.emit('join_room', { conversationId: convId }, () => resolve()));

  const received = new Promise((resolve) => c2.on('message_received', (msg) => resolve(msg)));
  await new Promise((resolve) => c1.emit('send_message', { conversationId: convId, content: 'hi via socket' }, () => resolve()));
  const msg = await received;
  expect(msg.content).toBe('hi via socket');

  c1.close();
  c2.close();
});
