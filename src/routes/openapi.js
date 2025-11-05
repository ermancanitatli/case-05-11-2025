'use strict';

const { Router } = require('express');
const router = Router();
const swaggerUi = require('swagger-ui-express');
const spec = require('../../docs/openapi.json');

router.get('/openapi.json', (req, res) => {
  res.json(spec);
});

router.use('/docs', swaggerUi.serve, swaggerUi.setup(spec));

module.exports = router;

