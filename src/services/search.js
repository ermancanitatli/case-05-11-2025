// Author: Erman CANITATLI
// Optional Elasticsearch client for message search.
'use strict';

const { Client } = require('@elastic/elasticsearch');
const url = process.env.ELASTICSEARCH_URL || '';
const indexName = process.env.ELASTICSEARCH_INDEX || 'messages';
let client = null;

// Returns ES client if URL is provided.
function getClient() {
  if (!url) return null;
  if (!client) client = new Client({ node: url });
  return client;
}

// Creates index lazily on first use.
async function ensureIndex() {
  const c = getClient();
  if (!c) return false;
  const exists = await c.indices.exists({ index: indexName });
  if (!exists) await c.indices.create({ index: indexName });
  return true;
}

// Indexes a message document.
async function indexMessage(msg) {
  const c = getClient();
  if (!c) return;
  await ensureIndex();
  await c.index({ index: indexName, id: String(msg.id || msg._id), document: { conversationId: String(msg.conversationId), senderId: String(msg.senderId), content: String(msg.content), createdAt: msg.createdAt } });
}

// Full‑text search on messages.
async function searchMessages(q, opts = {}) {
  const c = getClient();
  if (!c) return { items: [], total: 0 };
  const resp = await c.search({ index: indexName, size: Math.min(100, Number(opts.limit || 20)), from: Number(opts.offset || 0), query: { match: { content: q } } });
  const items = (resp.hits.hits || []).map((h) => ({ id: h._id, ...h._source }));
  return { items, total: resp.hits.total && typeof resp.hits.total === 'object' ? resp.hits.total.value : resp.hits.total };
}

module.exports = { indexMessage, searchMessages };
