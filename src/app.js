'use strict';

const express = require('express');
const securityMiddlewares = require('./middlewares/security');
const errorHandler = require('./middlewares/errorHandler');
const notFound = require('./middlewares/notFound');
const routes = require('./routes');
const { apiLimiter } = require('./middlewares/rateLimit');
const { errors } = require('celebrate');
const httpLogger = require('./middlewares/requestLogger');

function createApp() {
  const app = express();

  app.use(express.json({ limit: '1mb' }));
  app.use(express.urlencoded({ extended: false }));

  app.use(...securityMiddlewares());
  app.use(httpLogger);

  app.use('/api', apiLimiter, routes);

  app.use(notFound);
  app.use(errors());
  app.use(errorHandler);

  return app;
}

module.exports = createApp;
