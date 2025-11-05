'use strict';

const express = require('express');
const request = require('supertest');

jest.mock('../../src/models', () => ({
  User: { findById: jest.fn(() => ({ _id: 'u1', isDeleted: false, isActive: true })) }
}));

jest.mock('../../src/utils/jwt', () => ({
  verify: jest.fn(() => ({ sub: 'u1' }))
}));

const auth = require('../../src/middlewares/auth');

function makeApp() {
  const app = express();
  app.get('/secure', auth, (req, res) => res.json({ ok: true, user: req.user }));
  return app;
}

test('auth middleware requires bearer token', async () => {
  const app = makeApp();
  const res = await request(app).get('/secure');
  expect(res.status).toBe(401);
});

test('auth middleware allows valid user', async () => {
  const app = makeApp();
  const res = await request(app).get('/secure').set('Authorization', 'Bearer token');
  expect(res.status).toBe(200);
  expect(res.body.ok).toBe(true);
});

