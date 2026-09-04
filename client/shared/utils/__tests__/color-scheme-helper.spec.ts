import { parseColorScheme } from '../color-scheme-helper';

/**
 * `auto` 要问系统偏好, 所以每个用例都得自己说清楚系统当前偏好什么。
 *
 * 之前这里写的是 `['auto', { isDarkMode: true }]`, 靠的是 jsdom 没有 matchMedia、
 * 于是走进兜底分支。后来 test/setup.js 为了 shadcn 的 use-mobile 补了一个恒返回
 * `matches: false` 的 matchMedia, 这条用例就开始断言相反的东西了 —— 它测的其实是
 * "matchMedia 不存在", 而不是任何配色行为。
 */
const withPrefersDark = (matches: boolean | undefined) => {
  const original = window.matchMedia;

  if (matches === undefined) {
    // @ts-expect-error 故意删掉, 用来覆盖兜底分支
    delete window.matchMedia;
  } else {
    window.matchMedia = ((query: string) => ({
      matches,
      media: query,
      onchange: null,
      addListener() {},
      removeListener() {},
      addEventListener() {},
      removeEventListener() {},
      dispatchEvent: () => false,
    })) as unknown as typeof window.matchMedia;
  }

  return () => {
    window.matchMedia = original;
  };
};

describe('parseColorScheme', () => {
  test.each([
    ['dark', { isDarkMode: true, extraSchemeName: null }],
    ['light', { isDarkMode: false, extraSchemeName: null }],
    ['dark+miku', { isDarkMode: true, extraSchemeName: 'theme-miku' }],
    ['light+miku', { isDarkMode: false, extraSchemeName: 'theme-miku' }],
    // 没写 base 的插件主题按 dark 算
    ['miku', { isDarkMode: true, extraSchemeName: 'theme-miku' }],
  ])('%s', (input, output) => {
    expect(parseColorScheme(input)).toEqual(output);
  });

  describe('auto', () => {
    test.each([
      [true, true],
      [false, false],
    ])(
      'follows the system preference (prefers dark: %s)',
      (prefers, isDark) => {
        const restore = withPrefersDark(prefers);

        try {
          expect(parseColorScheme('auto')).toEqual({
            isDarkMode: isDark,
            extraSchemeName: null,
          });
        } finally {
          restore();
        }
      }
    );

    test('falls back to dark where matchMedia does not exist', () => {
      const restore = withPrefersDark(undefined);

      try {
        expect(parseColorScheme('auto')).toEqual({
          isDarkMode: true,
          extraSchemeName: null,
        });
      } finally {
        restore();
      }
    });
  });
});
