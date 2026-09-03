/** @type {import('ts-jest/dist/types').InitialOptionsTsJest} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  setupFiles: ['<rootDir>/test/setup.ts'],
  testPathIgnorePatterns: ['/node_modules/', '/dist/'],
  moduleNameMapper: {
    // axios 1.x ships ESM at its package root and relies on the `exports`
    // map to hand CommonJS consumers the .cjs build. jest 27 does not read
    // `exports`, so the SDK's OAuth client (which imports axios) broke every
    // suite. Node's own resolver picks the right build; reuse its answer.
    '^axios$': require.resolve('axios'),
  },
  globals: {
    'ts-jest': {
      tsconfig: 'tsconfig.json',
    },
  },
};
