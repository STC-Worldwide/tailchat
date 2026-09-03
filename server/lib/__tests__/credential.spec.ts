import { buildRateLimitKey, extractCredential } from '../credential';

describe('extractCredential', () => {
  test('prefers X-Token', () => {
    expect(
      extractCredential({
        'x-token': 'jwt-a',
        authorization: 'Bearer jwt-b',
        'x-api-key': 'key-c',
      })
    ).toBe('jwt-a');
  });

  test('reads a Bearer authorization header, case-insensitively', () => {
    expect(extractCredential({ authorization: 'Bearer abc' })).toBe('abc');
    expect(extractCredential({ authorization: 'bearer   abc  ' })).toBe('abc');
  });

  test('ignores non-Bearer authorization schemes', () => {
    expect(extractCredential({ authorization: 'Basic abc' })).toBeUndefined();
  });

  test('falls back to X-Api-Key', () => {
    expect(extractCredential({ 'x-api-key': 'k' })).toBe('k');
  });

  test('treats blank headers as absent', () => {
    expect(
      extractCredential({ 'x-token': '  ', authorization: 'Bearer ' })
    ).toBeUndefined();
    expect(extractCredential({})).toBeUndefined();
  });

  test('takes the first value of a repeated header', () => {
    expect(extractCredential({ 'x-token': ['first', 'second'] })).toBe('first');
  });
});

describe('buildRateLimitKey', () => {
  test('buckets by hashed credential and never embeds the raw value', () => {
    const key = buildRateLimitKey({ 'x-token': 'secret-token' }, '1.2.3.4');
    expect(key).toMatch(/^c:[0-9a-f]{32}$/);
    expect(key).not.toContain('secret-token');
  });

  test('same credential in different headers shares a bucket', () => {
    const a = buildRateLimitKey({ 'x-token': 'tok' }, '1.1.1.1');
    const b = buildRateLimitKey({ authorization: 'Bearer tok' }, '2.2.2.2');
    expect(a).toBe(b);
  });

  test('falls back to the IP when unauthenticated', () => {
    expect(buildRateLimitKey({}, '10.0.0.1')).toBe('ip:10.0.0.1');
    expect(buildRateLimitKey({}, undefined)).toBe('ip:unknown');
  });
});
