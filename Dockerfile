FROM node:18-alpine

WORKDIR /app

ENV COREPACK_ENABLE_DOWNLOAD_PROMPT=0
RUN corepack enable

COPY package.json ./

RUN yarn install --frozen-lockfile || yarn install

COPY src ./src
COPY tests ./tests
COPY jest.config.js ./jest.config.js
COPY docs ./docs
COPY .env.example ./.env.example

EXPOSE 3000

CMD ["yarn", "start"]
