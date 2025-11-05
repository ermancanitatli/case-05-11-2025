'use strict';

const http = require('http');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const createApp = require('../../src/app');
const { connectDB, disconnectDB } = require('../../src/lib/db');
const { connectRedis, disconnectRedis } = require('../../src/lib/redis');
const { setup: setupSocket } = require('../../src/realtime/socket');

async function startServer(withSocket = false) {
  let mongod = null;
  const useExternal = String(process.env.USE_EXTERNAL_MONGO || '').toLowerCase() === 'true';
  if (useExternal) {
    const uri = process.env.TEST_DB_URI || process.env.MONGODB_URI || 'mongodb://localhost:27017/realtime';
    process.env.MONGODB_URI = uri;
  } else {
    mongod = await MongoMemoryServer.create();
    process.env.MONGODB_URI = mongod.getUri();
  }
  await connectDB();
  const app = createApp();
  const server = http.createServer(app);
  let io = null;
  if (withSocket) io = setupSocket(server);
  await new Promise((resolve) => server.listen(0, resolve));
  const address = server.address();
  const baseURL = `http://127.0.0.1:${address.port}`;
  return { app, server, baseURL, mongod, io };
}

async function stopServer(ctx) {
  await new Promise((resolve) => ctx.server.close(resolve));
  await disconnectDB();
  try { await disconnectRedis(); } catch {}
  if (mongoose.connection && mongoose.connection.readyState) await mongoose.disconnect();
  if (ctx.mongod) await ctx.mongod.stop();
}

module.exports = { startServer, stopServer };
