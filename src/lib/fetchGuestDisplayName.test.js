import { test } from 'node:test';
import assert from 'node:assert/strict';
import { fetchGuestDisplayName } from './fetchGuestDisplayName.js';

// Save and restore global.fetch around each test via try/finally pattern

// Test 1: 200 OK with valid displayName resolves the displayName string
test('200 ok: resolves the displayName string from body', async () => {
  const realFetch = global.fetch;
  try {
    global.fetch = async () => ({
      ok: true,
      status: 200,
      json: async () => ({ id: 'abc123', displayName: 'DB Name' }),
    });
    const result = await fetchGuestDisplayName('abc123');
    assert.equal(result, 'DB Name', 'should return displayName from 200 response');
  } finally {
    global.fetch = realFetch;
  }
});

// Test 2: 404 resolves null
test('404: resolves null', async () => {
  const realFetch = global.fetch;
  try {
    global.fetch = async () => ({
      ok: false,
      status: 404,
      json: async () => ({ error: 'not found' }),
    });
    const result = await fetchGuestDisplayName('abc123');
    assert.equal(result, null, '404 should resolve null');
  } finally {
    global.fetch = realFetch;
  }
});

// Test 3: 500 resolves null
test('500: resolves null', async () => {
  const realFetch = global.fetch;
  try {
    global.fetch = async () => ({
      ok: false,
      status: 500,
      json: async () => ({ error: 'internal server error' }),
    });
    const result = await fetchGuestDisplayName('abc123');
    assert.equal(result, null, '500 should resolve null');
  } finally {
    global.fetch = realFetch;
  }
});

// Test 4: network error resolves null (never throws)
test('network error: resolves null, does not throw', async () => {
  const realFetch = global.fetch;
  try {
    global.fetch = async () => { throw new Error('net'); };
    const result = await fetchGuestDisplayName('abc123');
    assert.equal(result, null, 'network error should resolve null');
  } finally {
    global.fetch = realFetch;
  }
});

// Test 5: empty id resolves null WITHOUT calling fetch
test('empty id: resolves null without calling fetch', async () => {
  const realFetch = global.fetch;
  try {
    global.fetch = async () => { throw new Error('fetch should NOT be called for empty id'); };
    const result = await fetchGuestDisplayName('');
    assert.equal(result, null, 'empty id should resolve null without fetching');
  } finally {
    global.fetch = realFetch;
  }
});

// Test 6: 200 with no displayName field resolves null
test('200 with no displayName: resolves null', async () => {
  const realFetch = global.fetch;
  try {
    global.fetch = async () => ({
      ok: true,
      status: 200,
      json: async () => ({ id: 'abc123' }),
    });
    const result = await fetchGuestDisplayName('abc123');
    assert.equal(result, null, '200 with missing displayName should resolve null');
  } finally {
    global.fetch = realFetch;
  }
});

// Test 7: 200 with empty displayName string resolves null
test('200 with empty displayName string: resolves null', async () => {
  const realFetch = global.fetch;
  try {
    global.fetch = async () => ({
      ok: true,
      status: 200,
      json: async () => ({ id: 'abc123', displayName: '' }),
    });
    const result = await fetchGuestDisplayName('abc123');
    assert.equal(result, null, '200 with empty displayName should resolve null');
  } finally {
    global.fetch = realFetch;
  }
});

// Test 8: non-string id (null) resolves null without calling fetch
test('non-string id (null): resolves null without calling fetch', async () => {
  const realFetch = global.fetch;
  try {
    global.fetch = async () => { throw new Error('fetch should NOT be called for null id'); };
    const result = await fetchGuestDisplayName(null);
    assert.equal(result, null, 'null id should resolve null without fetching');
  } finally {
    global.fetch = realFetch;
  }
});

// Test 9: JSON parse failure resolves null
test('JSON parse failure: resolves null', async () => {
  const realFetch = global.fetch;
  try {
    global.fetch = async () => ({
      ok: true,
      status: 200,
      json: async () => { throw new SyntaxError('Unexpected token'); },
    });
    const result = await fetchGuestDisplayName('abc123');
    assert.equal(result, null, 'JSON parse failure should resolve null');
  } finally {
    global.fetch = realFetch;
  }
});

// Test 10: already-aborted signal swallows AbortError, resolves null
test('already-aborted signal: AbortError is swallowed, resolves null', async () => {
  const realFetch = global.fetch;
  try {
    const controller = new AbortController();
    controller.abort();
    global.fetch = async () => {
      const err = new Error('The operation was aborted');
      err.name = 'AbortError';
      throw err;
    };
    const result = await fetchGuestDisplayName('abc123', { signal: controller.signal });
    assert.equal(result, null, 'AbortError should be swallowed and resolve null');
  } finally {
    global.fetch = realFetch;
  }
});
