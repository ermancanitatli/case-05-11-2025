// Author: Erman CANITATLI
// Tiny HS256 JWT signer/verifier.
'use strict';

const crypto = require('crypto');

// Base64url encode.
function b64url(buf) {
  return Buffer.from(buf).toString('base64').replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
}

// Base64url JSON encode.
function b64urlJSON(obj) {
  return b64url(Buffer.from(JSON.stringify(obj)));
}

// Signs a payload with HS256.
function sign(payload, secret, expiresInSeconds) {
  const header = { alg: 'HS256', typ: 'JWT' };
  const now = Math.floor(Date.now() / 1000);
  const body = { iat: now, ...payload };
  if (expiresInSeconds && Number(expiresInSeconds) > 0) body.exp = now + Number(expiresInSeconds);
  const h = b64urlJSON(header);
  const p = b64urlJSON(body);
  const data = `${h}.${p}`;
  const sig = crypto.createHmac('sha256', secret).update(data).digest('base64').replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
  return `${data}.${sig}`;
}

// Verifies signature and exp.
function verify(token, secret) {
  const parts = String(token).split('.');
  if (parts.length !== 3) throw new Error('INVALID_TOKEN');
  const data = `${parts[0]}.${parts[1]}`;
  const expSig = parts[2];
  const sig = crypto.createHmac('sha256', secret).update(data).digest('base64').replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
  const a = Buffer.from(sig);
  const b = Buffer.from(expSig);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) throw new Error('INVALID_SIGNATURE');
  const payload = JSON.parse(Buffer.from(parts[1].replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString('utf8'));
  if (payload.exp && Math.floor(Date.now() / 1000) > payload.exp) throw new Error('TOKEN_EXPIRED');
  return payload;
}

module.exports = { sign, verify };
