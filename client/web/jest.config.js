const regeneratorRuntime = require('regenerator-runtime');
const { pathsToModuleNameMapper } = require('ts-jest');
const webCompilerOptions = require('./tsconfig.test.json').compilerOptions;

// 用于处理编译出来是esmodule会抛出 SyntaxError: Unexpected token 'export' 问题的包
const esModules = [
  'react-markdown',
  'vfile',
  'unist-util-stringify-position',
  'unified',
  'bail',
  'is-plain-obj',
  'trough',
  'remark-parse',
  'mdast-util-from-markdown',
  'mdast-util-to-string',
  'micromark',
  'decode-named-character-reference',
  'character-entities',
  'remark-rehype',
  'mdast-util-to-hast',
  'unist-builder',
  'unist-util-visit',
  'unist-util-is',
  'unist-util-position',
  'unist-util-generated',
  'mdast-util-definitions',
  'trim-lines',
  'property-information',
  'hast-util-whitespace',
  'space-separated-tokens',
  'comma-separated-tokens',
  'remark-gfm',
  'mdast-util-gfm',
  'mdast-util-gfm-autolink-literal',
  'mdast-util-find-and-replace',
  'mdast-util-to-markdown',
  'markdown-table',
  'escape-string-regexp',
  'ccount',
  'hast-util-raw',
  'rehype-raw',
  'rehype-sanitize',
  'hast-util-sanitize',
  'hast-util-from-parse5',
  'hast-util-to-parse5',
  'hastscript',
  'hast-util-parse-selector',
  'web-namespaces',
  'zwitch',
  'html-void-elements',
].join('|');

/*
 * 时区钉死在 UTC。
 *
 * 有些断言会把本地时间格式化后跟字面量比 (date-helper 就是), 不钉的话结果跟跑测试
 * 的机器在哪个时区有关 —— 开发机在 UTC+7、CI runner 在 UTC、原作者在 UTC+8, 三边
 * 谁也别想同时绿。写在这里而不是 setup.js: worker 是子进程, 从父进程继承 env, TZ
 * 必须在进程起来之前就定下来。
 */
process.env.TZ = 'UTC';

/** @type {import('ts-jest/dist/types').InitialOptionsTsJest} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  moduleNameMapper: {
    '\\.(css|less|scss)$': 'identity-obj-proxy',
    // jest 27 cannot resolve package-exports subpaths (cmdk -> radix-ui)
    '^@radix-ui/primitive/is-development$':
      '@radix-ui/primitive/dist/internal/is-development.true.js',
    // Jest 27 does not understand Base UI's package `imports` conditions.
    '^#prehydration/tabs/indicator$':
      '@base-ui/react/internals/prehydrationScript.stub.js',
    ...pathsToModuleNameMapper(webCompilerOptions.paths, {
      prefix: '<rootDir>/',
    }),
  },
  // projects: ['<rootDir>/web/'], // https://jestjs.io/docs/configuration#projects-arraystring--projectconfig
  rootDir: '.',
  /*
   * client/shared 的测试也要跑。
   *
   * CI 只有 `cd client/web && pnpm test` 这一条命令, 之前 roots 默认等于 rootDir,
   * 于是 client/shared 下的 spec 一个都不执行 —— 悄悄烂掉两个才被发现。
   */
  roots: ['<rootDir>', '<rootDir>/../shared'],
  testRegex: '.*\\.(test|spec)\\.tsx?$',
  testPathIgnorePatterns: ['/node_modules/'],
  transform: {
    '\\.(jpg|jpeg|png|gif|eot|otf|webp|svg|ttf|woff|woff2|mp4|webm|wav|mp3|m4a|aac|oga)$':
      '<rootDir>/test/fileTransformer.js',
    [`(${esModules}).+\\.(j|t)sx?$`]: 'ts-jest',
  },
  transformIgnorePatterns: [`/node_modules/\.pnpm/(?!(${esModules}))`],
  setupFiles: ['<rootDir>/test/setup.js'],
  setupFilesAfterEnv: [],
  globals: {
    window: {},
    'ts-jest': {
      tsconfig: 'tsconfig.test.json',
    },
  },
};
