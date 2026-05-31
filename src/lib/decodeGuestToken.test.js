import { test } from 'node:test';
import assert from 'node:assert/strict';
import { sign } from '../../scripts/lib/token.js';
import { decodeGuestToken } from './decodeGuestToken.js';

const SECRET = 'test-secret-do-not-ship';

// Helper: build a valid signed token for a given name
function makeToken(id, name) {
  const iat = Math.floor(Date.now() / 1000);
  return sign({ id, name, iat }, SECRET);
}

// Test 1: Valid token returns { id, name } matching the signed payload
test('valid token: returns { id, name } matching signed payload', () => {
  const id = 'guest-id-001';
  const name = 'The Johnson Family';
  const token = makeToken(id, name);
  const result = decodeGuestToken(token);
  assert.ok(result !== null, 'result should not be null for a valid token');
  assert.equal(result.id, id, 'id must match');
  assert.equal(result.name, name, 'name must match');
});

// Test 2: Valid token with unicode name round-trips intact
test('valid token: unicode name "Mike & Sarah" decodes correctly', () => {
  const id = 'unicode-guest-id';
  const name = 'Mike & Sarah';
  const token = makeToken(id, name);
  const result = decodeGuestToken(token);
  assert.ok(result !== null, 'result should not be null for unicode name token');
  assert.equal(result.name, 'Mike & Sarah', 'unicode name must survive decode');
  assert.equal(result.id, id, 'id must survive decode');
});

// Test 3: undefined input returns null (missing token -> fallback)
test('missing token: decodeGuestToken(undefined) returns null', () => {
  assert.equal(decodeGuestToken(undefined), null, 'undefined input should return null');
});

// Test 4: empty string returns null
test('missing token: decodeGuestToken("") returns null', () => {
  assert.equal(decodeGuestToken(''), null, 'empty string should return null');
});

// Test 5: malformed token without a dot returns null
test('malformed: no dot separator returns null (no throw)', () => {
  assert.equal(decodeGuestToken('garbage-no-dot'), null, 'token without dot should return null');
});

// Test 6: undecodable base64 payload returns null (does not throw)
test('malformed: undecodable base64 payload returns null (no throw)', () => {
  // '!!!' is not valid base64
  assert.equal(decodeGuestToken('notbase64!!.sig'), null, 'invalid base64 should return null');
});

// Test 7: valid base64url payload whose JSON lacks id/name returns null
test('malformed: payload JSON missing id/name fields returns null', () => {
  // Build a token whose payload is valid base64url JSON but missing id + name
  const incompletePayload = Buffer.from(JSON.stringify({ foo: 'bar', iat: 1748000000 }), 'utf8').toString('base64url');
  const fakeToken = `${incompletePayload}.fakesig`;
  assert.equal(decodeGuestToken(fakeToken), null, 'payload missing id/name should return null');
});

// Test 8: payload with id but missing name returns null
test('malformed: payload JSON missing name field returns null', () => {
  const incompletePayload = Buffer.from(JSON.stringify({ id: 'abc', iat: 1748000000 }), 'utf8').toString('base64url');
  const fakeToken = `${incompletePayload}.fakesig`;
  assert.equal(decodeGuestToken(fakeToken), null, 'payload missing name should return null');
});

// Test 9: result only contains id and name (iat is not returned)
test('output shape: result does not expose iat', () => {
  const id = 'guest-id-002';
  const name = 'The García Family';
  const token = makeToken(id, name);
  const result = decodeGuestToken(token);
  assert.ok(result !== null);
  assert.ok(!('iat' in result), 'iat should not be present in the decoded result');
  // Verify only id and name are returned
  const keys = Object.keys(result);
  assert.deepEqual(keys.sort(), ['id', 'name'].sort(), 'result should only have id and name keys');
});
