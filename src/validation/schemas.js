// Author: Erman CANITATLI
// Celebrate/Joi schemas for API validation.
'use strict';

const { celebrate, Joi, Segments } = require('celebrate');

const objectId = () => Joi.string().hex().length(24);

const auth = {
  register: celebrate({
    [Segments.BODY]: Joi.object({
      username: Joi.string().min(3).max(32).required(),
      email: Joi.string().email().required(),
      password: Joi.string().min(8).max(128).required()
    })
  }),
  login: celebrate({
    [Segments.BODY]: Joi.object({
      email: Joi.string().email().required(),
      password: Joi.string().min(8).max(128).required()
    })
  }),
  refresh: celebrate({
    [Segments.BODY]: Joi.object({
      refreshToken: Joi.string().min(20).required()
    })
  }),
  logout: celebrate({
    [Segments.BODY]: Joi.object({
      refreshToken: Joi.string().min(20).optional()
    })
  })
};

const users = {
  list: celebrate({
    [Segments.QUERY]: Joi.object({
      page: Joi.number().integer().min(1).default(1),
      limit: Joi.number().integer().min(1).max(100).default(20),
      q: Joi.string().allow('').optional()
    })
  })
};

const conversations = {
  list: celebrate({
    [Segments.QUERY]: Joi.object({
      page: Joi.number().integer().min(1).default(1),
      limit: Joi.number().integer().min(1).max(100).default(20)
    })
  }),
  detail: celebrate({
    [Segments.PARAMS]: Joi.object({
      id: objectId().required()
    })
  })
};

const messages = {
  list: celebrate({
    [Segments.PARAMS]: Joi.object({ id: objectId().required() }),
    [Segments.QUERY]: Joi.object({
      page: Joi.number().integer().min(1).default(1),
      limit: Joi.number().integer().min(1).max(100).default(20),
      sort: Joi.string().valid('asc', 'desc').default('desc'),
      before: Joi.date().iso().optional(),
      after: Joi.date().iso().optional()
    })
  }),
  create: celebrate({
    [Segments.BODY]: Joi.alternatives().try(
      Joi.object({ conversationId: objectId().required(), content: Joi.string().trim().min(1).max(5000).required() }),
      Joi.object({ toUserId: objectId().required(), content: Joi.string().trim().min(1).max(5000).required() })
    )
  }),
  read: celebrate({
    [Segments.PARAMS]: Joi.object({ id: objectId().required() })
  })
};

module.exports = { auth, users, conversations, messages };
