import { test } from 'node:test';
import assert from 'node:assert/strict';
import { renderInvite } from './email-template.js';

const DISPLAY_NAME = 'Mike & Sarah';
const URL = 'https://our-wedding.example/i/abc123?t=payload.sig';

// Test 1: returns an object with string subject, html, text
test('returns an object with string subject, html, text', () => {
  const result = renderInvite({ displayName: DISPLAY_NAME, url: URL });
  assert.equal(typeof result, 'object', 'result should be an object');
  assert.equal(typeof result.subject, 'string', 'subject should be a string');
  assert.equal(typeof result.html, 'string', 'html should be a string');
  assert.equal(typeof result.text, 'string', 'text should be a string');
});

// Test 2: subject is non-empty
test('subject is non-empty', () => {
  const { subject } = renderInvite({ displayName: DISPLAY_NAME, url: URL });
  assert.ok(subject.length > 0, 'subject must be non-empty');
});

// Test 3: displayName appears in html AND text
test('displayName appears in html and text', () => {
  const { html, text } = renderInvite({ displayName: DISPLAY_NAME, url: URL });
  assert.ok(html.includes(DISPLAY_NAME) || html.includes('Mike &amp; Sarah'),
    'displayName (or HTML-escaped form) must appear in html');
  assert.ok(text.includes(DISPLAY_NAME), 'displayName must appear in text');
});

// Test 4: url appears in html AND text
test('url appears in html and text', () => {
  const { html, text } = renderInvite({ displayName: DISPLAY_NAME, url: URL });
  assert.ok(html.includes(URL), 'url must appear in html');
  assert.ok(text.includes(URL), 'url must appear in text');
});

// Test 5: no date or location strings in html or text
test('html and text contain neither "Oahu" nor "2027"', () => {
  const { html, text } = renderInvite({ displayName: DISPLAY_NAME, url: URL });
  assert.ok(!html.includes('Oahu'), 'html must not contain "Oahu"');
  assert.ok(!html.includes('2027'), 'html must not contain "2027"');
  assert.ok(!text.includes('Oahu'), 'text must not contain "Oahu"');
  assert.ok(!text.includes('2027'), 'text must not contain "2027"');
});
