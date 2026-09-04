import {
  checkPathMatch,
  generateRandomStr,
  getEmailAddress,
  isRevalidatingStaticAsset,
  isValidStr,
  sleep,
} from '../utils';

describe('getEmailAddress', () => {
  test.each([
    ['foo@example.com', 'foo'],
    ['foo.bar@example.com', 'foo.bar'],
    ['foo$bar@example.com', 'foo$bar'],
  ])('%s', (input, output) => {
    expect(getEmailAddress(input)).toBe(output);
  });
});

describe('generateRandomStr', () => {
  test('should generate string with length 10(default)', () => {
    expect(generateRandomStr()).toHaveLength(10);
  });

  test('should generate string with manual length', () => {
    expect(generateRandomStr(4)).toHaveLength(4);
  });
});

describe('isValidStr', () => {
  test.each<[any, boolean]>([
    [false, false],
    [true, false],
    [0, false],
    [1, false],
    ['', false],
    [{}, false],
    [[], false],
    ['foo', true],
  ])('%p is %p', (input, output) => {
    expect(isValidStr(input)).toBe(output);
  });
});

test('sleep', async () => {
  const start = new Date().valueOf();
  await sleep(1000);
  const end = new Date().valueOf();

  const duration = end - start;
  expect(duration).toBeGreaterThanOrEqual(1000);
  expect(duration).toBeLessThan(1050);
});

describe('checkPathMatch', () => {
  const testList = ['/foo/bar'];

  test.each([
    ['/foo/bar', true],
    ['/foo/bar?query=1', true],
    ['/foo', false],
    ['/foo/baz', false],
    ['/foo/baz?bar=', false],
  ])('%s', (input, output) => {
    expect(checkPathMatch(testList, input)).toBe(output);
  });
});

describe('isRevalidatingStaticAsset', () => {
  const win = (p: string) => p.split('/').join('\\');

  test('plugin entry files revalidate — they carry no content hash', () => {
    // These names are stable across releases, so a long max-age pins a browser
    // to whichever plugin build it happened to see first.
    expect(
      isRevalidatingStaticAsset('/app/public/plugins/com.foo.bar/index.js')
    ).toBe(true);
    expect(
      isRevalidatingStaticAsset('/app/public/plugins/com.foo.bar/manifest.json')
    ).toBe(true);
  });

  test('hashed plugin chunks keep the long cache', () => {
    expect(
      isRevalidatingStaticAsset(
        '/app/public/plugins/com.foo.bar/index-8ef1afeb.js'
      )
    ).toBe(false);
    expect(
      isRevalidatingStaticAsset(
        '/app/public/plugins/com.foo.bar/shared-70edd496.js'
      )
    ).toBe(false);
  });

  test('the plugin registry revalidates', () => {
    expect(isRevalidatingStaticAsset('/app/public/registry-be.json')).toBe(
      true
    );
  });

  test('non-plugin assets are untouched', () => {
    expect(
      isRevalidatingStaticAsset('/app/public/app.15b3d2f21dcc47d67c84.js')
    ).toBe(false);
    expect(isRevalidatingStaticAsset('/app/public/logo.png')).toBe(false);
  });

  test('works with windows separators', () => {
    expect(
      isRevalidatingStaticAsset(win('/app/public/plugins/com.foo.bar/index.js'))
    ).toBe(true);
    expect(
      isRevalidatingStaticAsset(
        win('/app/public/plugins/com.foo.bar/index-8ef1afeb.js')
      )
    ).toBe(false);
  });
});
