import { getStore } from '@netlify/blobs';
import { createApp } from '../lib/core.mjs';

// One Blobs store per collection. "strong" consistency so a new account or a
// freshly granted lesson is visible immediately.
const stores = new Map();
const open = (name) => {
  if (!stores.has(name)) stores.set(name, getStore({ name: `clivedu-${name}`, consistency: 'strong' }));
  return stores.get(name);
};

const db = {
  async getJSON(store, key) { return (await open(store).get(key, { type: 'json' })) ?? null; },
  async setJSON(store, key, val) { await open(store).setJSON(key, val); },
  async del(store, key) { await open(store).delete(key); },
  async keys(store, prefix) {
    const { blobs } = await open(store).list(prefix ? { prefix } : undefined);
    return blobs.map((b) => b.key);
  },
  async getBin(store, key) {
    const buf = await open(store).get(key, { type: 'arrayBuffer' });
    return buf ? new Uint8Array(buf) : null;
  },
  async setBin(store, key, bytes) { await open(store).set(key, bytes); },
  async streamBin(store, key) { return (await open(store).get(key, { type: 'stream' })) ?? null; },
};

const app = createApp(db, (name) => Netlify.env.get(name));

export default async (req) => app(req);

export const config = { path: '/api/*' };
