/**
 * Criterion-#4 harness (throwaway, NOT production code)
 *
 * Proves that:
 * 1. A crafted valid token URL -> decodes to correct guest name
 * 2. A missing/malformed token -> decodes to null (future fallback: "Our Beloved Guests")
 *
 * Run with: node scripts/check-token-url.js
 */

import { randomUUID } from 'node:crypto';
import { sign } from './lib/token.js';
import { decodeGuestToken } from '../src/lib/decodeGuestToken.js';

const THROWAWAY_SECRET = 'harness-secret-do-not-use-in-production';

// Sign a sample payload for a real guest
const sampleId = randomUUID();
const sampleName = 'Mike & Sarah';
const samplePayload = {
  id: sampleId,
  name: sampleName,
  iat: Math.floor(Date.now() / 1000),
};

const token = sign(samplePayload, THROWAWAY_SECRET);

// Build the crafted URL (matches the locked URL shape from the contract)
const craftedUrl = `/i/${sampleId}?t=${token}`;

console.log('--- Criterion #4 Harness ---');
console.log(`Crafted URL: ${craftedUrl}`);

// Decode via the browser-safe util (extract just the t= value)
const tParam = new URL(craftedUrl, 'http://localhost').searchParams.get('t');
const decodedValid = decodeGuestToken(tParam);

console.log(`\nValid token decode result: ${JSON.stringify(decodedValid)}`);

// Test malformed token fallback
const decodedMalformed = decodeGuestToken('broken');
console.log(`Malformed token decode result: ${JSON.stringify(decodedMalformed)}`);

// Test missing token fallback
const decodedMissing = decodeGuestToken(undefined);
console.log(`Missing token decode result: ${JSON.stringify(decodedMissing)}`);

// Evaluate pass/fail
const validPasses = decodedValid !== null && decodedValid.name === sampleName;
const malformedPasses = decodedMalformed === null;
const missingPasses = decodedMissing === null;

console.log('\n--- Results ---');
console.log(`Valid URL -> correct name ("${sampleName}"): ${validPasses ? 'PASS' : 'FAIL'}`);
console.log(`Malformed token -> null (future: "Our Beloved Guests"): ${malformedPasses ? 'PASS' : 'FAIL'}`);
console.log(`Missing token -> null (future: "Our Beloved Guests"): ${missingPasses ? 'PASS' : 'FAIL'}`);

if (validPasses && malformedPasses && missingPasses) {
  console.log('\nCRITERION #4: PASS');
  process.exit(0);
} else {
  console.error('\nCRITERION #4: FAIL');
  process.exit(1);
}
