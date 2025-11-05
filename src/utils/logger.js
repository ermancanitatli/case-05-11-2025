'use strict';

const pino = require('pino');
const env = process.env.NODE_ENV || 'development';
const transport = env === 'production' ? undefined : { target: 'pino-pretty', options: { translateTime: true, ignore: 'pid,hostname' } };
const logger = pino({ level: 'info', transport });

module.exports = {
  debug: (m, meta) => logger.debug(meta || {}, m),
  info: (m, meta) => logger.info(meta || {}, m),
  warn: (m, meta) => logger.warn(meta || {}, m),
  error: (m, meta) => logger.error(meta || {}, m),
  child: (bindings) => logger.child(bindings)
};
