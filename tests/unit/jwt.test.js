'use strict';

const { sign, verify } = require('../../src/utils/jwt');

test('jwt sign/verify works', () => {
  const t = sign({ sub: 'u1' }, 'secret', 2);
  const p = verify(t, 'secret');
  expect(p.sub).toBe('u1');
});

test('jwt invalid signature throws', () => {
  const t = sign({ sub: 'u1' }, 'secret', 2);
  expect(() => verify(t, 'other')).toThrow();
});

