'use strict';

const { hashPassword, verifyPassword } = require('../../src/utils/password');

test('password hash/verify works', () => {
  const h = hashPassword('Passw0rd!');
  expect(h).toBeTruthy();
  expect(verifyPassword('Passw0rd!', h)).toBe(true);
  expect(verifyPassword('wrong', h)).toBe(false);
});

