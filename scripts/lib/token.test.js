import { test } from 'node:test';
import assert from 'node:assert/strict';
import { sign, verify, encodePayload } from './token.js';

const SECRET = 'test-secret-do-not-ship';

const samplePayload = {
  id: 'abc123xyz_sample-id',
  name: 'The Johnson Family',
  iat: 1748000000,
};

// Test 1: Round-trip — verify(sign(payload, secret), secret) === true
test('round-trip: verify returns true for freshly signed token', () => {
  const token = sign(samplePayload, SECRET);
  assert.equal(typeof token, 'string', 'sign should return a string');
  assert.ok(token.includes('.'), 'token must contain a dot separator');
  assert.equal(verify(token, SECRET), true, 'verify should return true for freshly signed token');
});

// Test 2: Tamper-detection — mutating a char in the payload segment makes verify return false
test('tamper-detection: mutated payload segment fails verify', () => {
  const token = sign(samplePayload, SECRET);
  const [b64, sig] = token.split('.');
  // Flip the first character of the payload
  const mutatedChar = b64[0] === 'A' ? 'B' : 'A';
  const tamperedPayload = mutatedChar + b64.slice(1);
  const tamperedToken = `${tamperedPayload}.${sig}`;
  assert.equal(verify(tamperedToken, SECRET), false, 'verify should return false for mutated payload');
});

// Test 3: Tamper-detection — mutating a char in the hmac segment makes verify return false
test('tamper-detection: mutated hmac segment fails verify', () => {
  const token = sign(samplePayload, SECRET);
  const [b64, sig] = token.split('.');
  // Flip the first character of the signature
  const mutatedChar = sig[0] === 'A' ? 'B' : 'A';
  const tamperedSig = mutatedChar + sig.slice(1);
  const tamperedToken = `${b64}.${tamperedSig}`;
  assert.equal(verify(tamperedToken, SECRET), false, 'verify should return false for mutated hmac');
});

// Test 4: Wrong secret makes verify return false
test('wrong-secret: verify returns false when secret does not match', () => {
  const token = sign(samplePayload, SECRET);
  assert.equal(verify(token, 'wrong-secret'), false, 'verify should return false for wrong secret');
});

// Test 5: Unicode round-trip — 'Mike & Sarah' survives sign -> split -> base64url-decode -> JSON.parse
test('unicode: "Mike & Sarah" survives sign -> decode round-trip', () => {
  const unicodePayload = {
    id: 'unicode-test-id',
    name: 'Mike & Sarah',
    iat: 1748000000,
  };
  const token = sign(unicodePayload, SECRET);
  const [b64] = token.split('.');
  // Manually decode base64url payload
  const json = Buffer.from(b64, 'base64url').toString('utf8');
  const parsed = JSON.parse(json);
  assert.equal(parsed.name, 'Mike & Sarah', 'unicode name must survive full round-trip intact');
  assert.equal(parsed.id, 'unicode-test-id', 'id must survive round-trip intact');
});

// Test 6: Malformed token (no dot) returns false, does not throw
test('malformed: token with no dot returns false (no throw)', () => {
  assert.equal(verify('nodotinhere', SECRET), false, 'verify should return false for token without dot');
});

// Test 7: Empty string returns false, does not throw
test('malformed: empty token returns false (no throw)', () => {
  assert.equal(verify('', SECRET), false, 'verify should return false for empty string');
});

// Test 8: Non-string input returns false, does not throw
test('malformed: non-string input returns false (no throw)', () => {
  assert.equal(verify(null, SECRET), false, 'verify should return false for null input');
  assert.equal(verify(undefined, SECRET), false, 'verify should return false for undefined input');
  assert.equal(verify(42, SECRET), false, 'verify should return false for numeric input');
});

// Test 9: encodePayload produces valid base64url JSON
test('encodePayload: produces decodable base64url JSON', () => {
  const encoded = encodePayload(samplePayload);
  assert.equal(typeof encoded, 'string', 'encodePayload should return a string');
  const json = Buffer.from(encoded, 'base64url').toString('utf8');
  const decoded = JSON.parse(json);
  assert.equal(decoded.id, samplePayload.id);
  assert.equal(decoded.name, samplePayload.name);
  assert.equal(decoded.iat, samplePayload.iat);
});
