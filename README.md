# Realtime Messaging (simple)

Small Express + Socket.IO backend. Runs with Docker. Tests run in Docker too. That’s it.

## Quick start

- Start everything: `docker compose up --build`
- Health: `http://localhost:3000/api/health`
- Docs: `http://localhost:3000/api/docs`

## Tests (Docker)

First start infra:

- `docker compose up -d mongo redis rabbitmq`

Then run what you need:

- All integration: `docker compose run --rm -e USE_EXTERNAL_MONGO=true app yarn test:integration`
- Socket tests: `docker compose run --rm app yarn test:socket`
- Unit tests: `docker compose run --rm app yarn test:unit`
- Quick smoke: `docker compose run --rm -e USE_EXTERNAL_MONGO=true app jest --runInBand tests/integration/smoke.api.test.js`
- RabbitMQ flow: `docker compose run --rm -e USE_EXTERNAL_MONGO=true app jest --runInBand tests/integration/rabbitmq.flow.test.js`

## Notes

- Package manager: yarn
- Local run (optional): `yarn dev`
- Stop containers: `docker compose down`
