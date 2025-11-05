# Realtime Messaging Backend

Node.js backend for real‑time messaging built with Express and Socket.IO. You can run the app and its dependencies (MongoDB, Redis, RabbitMQ) with Docker Compose, and you can execute the test suites inside a container. The only supported package manager is `yarn`.

## Requirements

- Docker and Docker Compose (v2: `docker compose`, v1: `docker-compose`)
- Node.js 18+ (only for local, non‑Docker runs)
- Yarn (only for local, non‑Docker runs)

## Environment Variables

- Example file: `.env.example`
- The Compose `app` service injects:
  - `MONGODB_URI=mongodb://mongo:27017/realtime`
  - `REDIS_URL=redis://redis:6379`
  - `RABBITMQ_URL=amqp://rabbitmq:5672`
  - `PORT=3000` and JWT settings

You can still use a local `.env` when running without Docker. With Compose these defaults are already provided.

## Service Ports

- App: `http://localhost:3000`
- Swagger UI: `http://localhost:3000/api/docs`
- OpenAPI JSON: `http://localhost:3000/api/openapi.json`
- MongoDB: `localhost:27017`
- Redis: `localhost:6379`
- RabbitMQ AMQP: `localhost:5672`
- RabbitMQ Management UI: `http://localhost:15672` (default: `guest`/`guest`)

## Run Server with Docker

Build and start everything:

- `docker compose up --build`

Only start the app (dependencies start automatically via `depends_on`):

- `docker compose up app`

Run in background:

- `docker compose up -d`

Stop and clean up:

- `docker compose down` (stop containers)
- `docker compose down -v` (containers + named volumes)

## Run Tests with Docker

There is no dedicated “test” service in the current Compose file. You cannot flip `up` into “test mode” via a parameter. Use one of the two flows below:

1) Ephemeral container (recommended)

- Start infra in background: `docker compose up -d mongo redis rabbitmq`
- Run all tests in a one‑off container: `docker compose run --rm -e USE_EXTERNAL_MONGO=true app yarn test`
- Subsets:
  - Unit: `docker compose run --rm app yarn test:unit`
  - Integration: `docker compose run --rm -e USE_EXTERNAL_MONGO=true app yarn test:integration`
  - Socket: `docker compose run --rm app yarn test:socket`

Notes:
- Socket tests are designed to work with an external MongoDB. The `app` service already has `MONGODB_URI=mongodb://mongo:27017/realtime`, so keeping the `mongo` service up is sufficient.
- `docker compose run` does not auto‑start `depends_on` services, so make sure `mongo`, `redis`, and `rabbitmq` are up first with `-d`.

2) Inside a running container

- Start everything: `docker compose up -d`
- Execute tests in the running app container: `docker compose exec app yarn test`

Warning: The app process (`yarn start`) remains active while tests run. Prefer flow (1) to avoid data/process interference.

## Local (Non‑Docker) Run (Optional)

- Install dependencies: `yarn install`
- Development: `yarn dev`
- Tests: `yarn test`

## FAQ

- “Can I pass a parameter to docker‑compose up to run tests?”
  - Not with the current Compose file. `up` honors the service `CMD/command`. Use `docker compose run --rm app yarn test` or `docker compose exec app yarn test`. If you want, a dedicated `tests` service can be added later.

- “Can I start only the server?”
  - Yes. `docker compose up app` starts the app service along with its dependencies.

## Quick Check

- `docker compose up --build -d`
- `curl http://localhost:3000/api/health` should return `{ success: true, data: { status: 'ok', ... } }`.
