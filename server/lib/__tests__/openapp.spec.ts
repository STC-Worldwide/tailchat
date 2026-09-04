import { config } from 'tailchat-server-sdk';
import { canCreateOpenApp } from '../openapp';

describe('canCreateOpenApp', () => {
  const feature = config.feature as Record<string, unknown>;
  const original = feature.disableOpenAppCreate;
  const originalAdmins = [...config.adminUserIds];

  afterEach(() => {
    feature.disableOpenAppCreate = original;
    config.adminUserIds.splice(
      0,
      config.adminUserIds.length,
      ...originalAdmins
    );
  });

  test('with the flag off, anyone may create one (upstream behaviour)', () => {
    feature.disableOpenAppCreate = false;

    expect(canCreateOpenApp('62d1f1a0c0ffee0000000001')).toBe(true);
  });

  test('with the flag on, an ordinary user may not', () => {
    feature.disableOpenAppCreate = true;
    config.adminUserIds.splice(0, config.adminUserIds.length);

    expect(canCreateOpenApp('62d1f1a0c0ffee0000000001')).toBe(false);
  });

  test('with the flag on, a listed admin still may', () => {
    feature.disableOpenAppCreate = true;
    config.adminUserIds.splice(
      0,
      config.adminUserIds.length,
      '62d1f1a0c0ffee0000000001'
    );

    expect(canCreateOpenApp('62d1f1a0c0ffee0000000001')).toBe(true);
    expect(canCreateOpenApp('62d1f1a0c0ffee0000000002')).toBe(false);
  });

  test('a missing or non-string user id is never an admin', () => {
    feature.disableOpenAppCreate = true;

    expect(canCreateOpenApp(undefined)).toBe(false);
    expect(canCreateOpenApp('')).toBe(false);
    expect(canCreateOpenApp({ toString: () => 'admin' })).toBe(false);
  });
});
