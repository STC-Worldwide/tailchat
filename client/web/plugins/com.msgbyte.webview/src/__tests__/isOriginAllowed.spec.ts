import { isOriginAllowed } from '../group/isOriginAllowed';

describe('isOriginAllowed', () => {
  test('an empty list authorises nothing', () => {
    // A deployment that has not named its origins has not approved any.
    expect(isOriginAllowed('https://example.com/dash', [])).toBe(false);
    expect(isOriginAllowed('https://example.com/dash', undefined)).toBe(false);
  });

  test('a bare * restores upstream behaviour', () => {
    expect(isOriginAllowed('https://anything.example/x', ['*'])).toBe(true);
    expect(isOriginAllowed('http://10.0.0.5:8080/', ['*'])).toBe(true);
  });

  test('entries match with or without a scheme', () => {
    expect(
      isOriginAllowed('https://docs.example.com/a', [
        'https://docs.example.com',
      ])
    ).toBe(true);
    expect(
      isOriginAllowed('https://docs.example.com/a', ['docs.example.com'])
    ).toBe(true);
  });

  test('the match is on origin, not on prefix', () => {
    const list = ['https://docs.example.com'];

    // The classic allowlist bug: a substring check would pass all of these.
    expect(isOriginAllowed('https://docs.example.com.evil.test/', list)).toBe(
      false
    );
    expect(isOriginAllowed('https://evil.test/docs.example.com', list)).toBe(
      false
    );
    expect(isOriginAllowed('https://sub.docs.example.com/', list)).toBe(false);
  });

  test('scheme and port are part of the origin', () => {
    expect(
      isOriginAllowed('http://docs.example.com/', ['https://docs.example.com'])
    ).toBe(false);
    expect(
      isOriginAllowed('https://docs.example.com:8443/', [
        'https://docs.example.com',
      ])
    ).toBe(false);
    expect(
      isOriginAllowed('https://docs.example.com:8443/', [
        'https://docs.example.com:8443',
      ])
    ).toBe(true);
  });

  test('host comparison ignores case', () => {
    expect(
      isOriginAllowed('https://DOCS.example.com/', ['docs.example.com'])
    ).toBe(true);
  });

  test('only http and https can be embedded', () => {
    // These have no origin to compare; treating them as allowed would let a
    // panel run script in the app's own context.
    // Even "allow everything" does not mean this: a `javascript:` src runs in
    // the embedding page's own context, which is the app's origin.
    expect(isOriginAllowed('javascript:alert(1)', ['*'])).toBe(false);
    expect(isOriginAllowed('javascript:alert(1)', ['example.com'])).toBe(false);
    expect(isOriginAllowed('data:text/html,<b>x', ['example.com'])).toBe(false);
    expect(isOriginAllowed('file:///etc/passwd', ['example.com'])).toBe(false);
  });

  test('an unparseable url is not allowed', () => {
    expect(isOriginAllowed('', ['example.com'])).toBe(false);
    expect(isOriginAllowed('not a url', ['example.com'])).toBe(false);
  });

  test('blank entries are ignored rather than matching everything', () => {
    expect(isOriginAllowed('https://example.com/', ['', '   '])).toBe(false);
  });
});
