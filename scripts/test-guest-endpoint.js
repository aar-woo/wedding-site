// scripts/test-guest-endpoint.js
// Local Node harness for smoke-testing api/guest/[id].js against the live Neon DB.
// No Vercel CLI needed — imports the handler directly and exercises it with a fake req/res.
//
// Run:
//   node --env-file=.env.local scripts/test-guest-endpoint.js <id>           # expect HTTP 200
//   node --env-file=.env.local scripts/test-guest-endpoint.js fake-id-000    # expect HTTP 404
//   node --env-file=.env.local scripts/test-guest-endpoint.js fake-id-000 POST  # expect HTTP 405
//
// Requires DATABASE_URL in .env.local (see .env.example).

import handler from '../api/guest/[id].js';

const id = process.argv[2] || 'test-id';
const method = process.argv[3] || 'GET';

const req = {
  method,
  query: { id },
};

const res = {
  _status: 200,
  status(code) { this._status = code; return this; },
  json(body) { console.log(`HTTP ${this._status}:`, JSON.stringify(body, null, 2)); return this; },
};

await handler(req, res);
