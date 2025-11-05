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

test('auth flow register -> login -> me -> refresh -> logout', async () => {
  const { baseURL, app } = ctx;
  const u = `user_${Date.now()}@ex.com`;
  const r1 = await request(app).post('/api/auth/register').send({ username: `u_${Date.now()}`, email: u, password: 'Passw0rd!' });
  expect(r1.status).toBe(200);
  const r2 = await request(app).post('/api/auth/login').send({ email: u, password: 'Passw0rd!' });
  expect(r2.status).toBe(200);
  const at = r2.body.data.accessToken;
  const rt = r2.body.data.refreshToken;
  const r3 = await request(app).get('/api/auth/me').set('Authorization', `Bearer ${at}`);
  expect(r3.status).toBe(200);
  const r4 = await request(app).post('/api/auth/refresh').send({ refreshToken: rt });
  expect(r4.status).toBe(200);
  const r5 = await request(app).post('/api/auth/logout').send({ refreshToken: rt });
  expect(r5.status).toBe(200);
});
