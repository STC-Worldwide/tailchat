import assert from 'node:assert/strict';
import test from 'node:test';

import { renderResult } from '../src/render.js';

test('a small result is returned whole', () => {
  assert.deepEqual(JSON.parse(renderResult({ a: 1, b: [1, 2] })), {
    a: 1,
    b: [1, 2],
  });
});

test('an oversized list is trimmed with an explicit note and stays valid JSON', () => {
  const messages = Array.from({ length: 400 }, (_, i) => ({
    id: `m${i}`,
    content: 'x'.repeat(50),
  }));
  const text = renderResult({ converseId: 'c', messages }, 6000);
  const parsed = JSON.parse(text);
  assert.ok(parsed.messages.length > 0);
  assert.ok(parsed.messages.length < 400);
  assert.equal(parsed._truncated.field, 'messages');
  assert.equal(parsed._truncated.of, 400);
  assert.equal(parsed._truncated.returned, parsed.messages.length);
  assert.match(parsed._truncated.note, /narrow the request/);
  assert.ok(Buffer.byteLength(text, 'utf8') <= 6000);
});

test('a bare array is wrapped so it can be trimmed the same way', () => {
  const text = renderResult(
    Array.from({ length: 1000 }, (_, i) => ({ i })),
    2000
  );
  const parsed = JSON.parse(text);
  assert.ok(Array.isArray(parsed.items));
  assert.equal(parsed._truncated.field, 'items');
});

test('an oversized scalar says plainly that it is no longer JSON', () => {
  const text = renderResult({ blob: 'y'.repeat(5000) }, 400);
  assert.match(text, /TRUNCATED at 400 bytes/);
  assert.throws(() => JSON.parse(text));
});
