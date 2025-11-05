'use strict';

const pinoHttp = require('pino-http');
const logger = require('../utils/logger');

const httpLogger = pinoHttp({
  logger: logger.child({ layer: 'http' }),
  autoLogging: true
});

module.exports = httpLogger;

