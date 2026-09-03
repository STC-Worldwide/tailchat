/**
 * Shared test constants. Deliberately importing nothing: this file is read by
 * `test/setup.ts`, which runs before the SDK's config module is first loaded,
 * so it must not pull that module in early.
 */

/**
 * The user id treated as a server administrator during tests. `test/setup.ts`
 * publishes it as ADMIN_USER_IDS before any module reads the environment.
 */
export const TEST_ADMIN_USER_ID = '0000000000000000000000ad';
