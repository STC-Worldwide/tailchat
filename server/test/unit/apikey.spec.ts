import {
  API_KEY_LENGTH,
  API_KEY_SCOPES,
  apiKeyScopeNames,
  expandApiKeyScopes,
  filterApiKeyScopes,
  formatApiKey,
  hashApiKeySecret,
  isApiKey,
  matchActionScopes,
  parseApiKey,
  scopesForAction,
  verifyApiKeySecret,
} from 'tailchat-server-sdk';

const KEY_ID = 'AbCdEfGhIjKl';
const SECRET = '0123456789abcdefghijklmnopqrstuv';

describe('api key format', () => {
  test('format and parse round-trip', () => {
    const key = formatApiKey(KEY_ID, SECRET);
    expect(key).toHaveLength(API_KEY_LENGTH);
    expect(isApiKey(key)).toBe(true);
    expect(parseApiKey(key)).toEqual({ keyId: KEY_ID, secret: SECRET });
  });

  test('rejects anything that is not exactly a key', () => {
    const key = formatApiKey(KEY_ID, SECRET);
    expect(isApiKey(key.slice(0, -1))).toBe(false);
    expect(isApiKey(key + 'x')).toBe(false);
    expect(isApiKey('jwt.' + key.slice(4))).toBe(false);
    expect(isApiKey(key.replace('a', '_'))).toBe(false);
    expect(isApiKey(undefined)).toBe(false);
    expect(isApiKey(42)).toBe(false);
    expect(parseApiKey('nope')).toBeNull();
  });

  test('a JWT is never mistaken for a key', () => {
    const jwt =
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJfaWQiOiIxIn0.abcdefghijklmnop';
    expect(isApiKey(jwt)).toBe(false);
  });
});

describe('api key hashing', () => {
  test('hash is sha256 hex and verification is exact', () => {
    const hash = hashApiKeySecret(SECRET);
    expect(hash).toMatch(/^[0-9a-f]{64}$/);
    expect(verifyApiKeySecret(SECRET, hash)).toBe(true);
    expect(verifyApiKeySecret(SECRET.replace('0', '1'), hash)).toBe(false);
  });

  test('verification never throws on malformed input', () => {
    expect(verifyApiKeySecret(SECRET, 'not-hex')).toBe(false);
    expect(verifyApiKeySecret(SECRET, '')).toBe(false);
    expect(verifyApiKeySecret(undefined as any, hashApiKeySecret(SECRET))).toBe(
      false
    );
  });
});

describe('api key scopes', () => {
  test('catalog entries all have descriptions and actions', () => {
    for (const name of apiKeyScopeNames) {
      expect(API_KEY_SCOPES[name].description.length).toBeGreaterThan(0);
      expect(API_KEY_SCOPES[name].actions.length).toBeGreaterThan(0);
    }
  });

  test('filterApiKeyScopes drops unknown names and duplicates', () => {
    expect(
      filterApiKeyScopes([
        'message:write',
        'bogus',
        'message:read',
        'message:read',
      ])
    ).toEqual(['message:read', 'message:write']);
  });

  test('expandApiKeyScopes ignores unknown scopes', () => {
    expect(expandApiKeyScopes(['bogus'])).toEqual([]);
    expect(expandApiKeyScopes(['file'])).toEqual(API_KEY_SCOPES.file.actions);
  });

  test.each([
    ['chat.message.sendMessage', ['message:write'], true],
    ['chat.message.sendMessage', ['message:read'], false],
    ['chat.message.fetchConverseMessage', ['message:read'], true],
    ['group.createGroupPanel', ['group:manage'], true],
    ['group.createGroupPanel', ['group:read'], false],
    ['group.invite.createGroupInvite', ['group:manage'], true],
    ['group.getGroupBasicInfo', ['group:read'], true],
    ['group.addGroupMember', ['group:manage'], true],
    ['admin.banUser', ['admin'], true],
    ['admin.banUser', ['group:manage', 'message:write'], false],
    ['user.apikey.create', ['admin', 'group:manage', 'user:write'], false],
    ['openapi.app.create', apiKeyScopeNames, false],
    ['plugin:com.msgbyte.tasks.create', ['plugins'], true],
    ['file.save', ['file'], true],
    ['user.whoami', ['user:read'], true],
    ['user.modifyPassword', apiKeyScopeNames, false],
    ['', ['group:manage'], false],
  ])('%s with %p -> %p', (action, scopes, allowed) => {
    expect(matchActionScopes(action, scopes)).toBe(allowed);
  });

  test('scopesForAction lists every scope that permits an action', () => {
    expect(scopesForAction('group.getGroupBasicInfo')).toEqual([
      'group:read',
      'group:manage',
    ]);
    expect(scopesForAction('openapi.app.create')).toEqual([]);
  });
});
