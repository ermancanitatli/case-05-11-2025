'use strict';

function parseDurationToSeconds(input) {
  if (!input) return 0;
  if (typeof input === 'number') return input;
  const m = String(input).trim().match(/^(\d+)([smhd])?$/i);
  if (!m) return Number(input) || 0;
  const n = Number(m[1]);
  const u = (m[2] || 's').toLowerCase();
  if (u === 's') return n;
  if (u === 'm') return n * 60;
  if (u === 'h') return n * 3600;
  if (u === 'd') return n * 86400;
  return n;
}

module.exports = { parseDurationToSeconds };

