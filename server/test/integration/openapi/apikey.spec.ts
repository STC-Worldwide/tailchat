import { createTestServiceBroker } from '../../utils';
import OpenApiKeyService from '../../../services/openapi/apikey.service';
import { Types } from 'mongoose';
import {
  hashApiKeySecret,
  isApiKey,
  parseApiKey,
  SYSTEM_USERID,
} from 'tailchat-server-sdk';

const ownerId = String(new Types.ObjectId());
const strangerId = String(new Types.ObjectId());
const botUserId = String(new Types.ObjectId());

/**
 * The OpenApp the mocked `openapi.app.get` returns. Tests mutate
 * `capability` to simulate a capability being removed after a key exists.
 */
const app = {
  _id: String(new Types.ObjectId()),
  appId: `tc_${new Types.ObjectId().toString()}`,
  owner: ownerId,
  appName: 'agent',
  appDesc: '',
  appIcon: '',
  capability: ['bot', 'admin'] as string[],
};

/**
 * ctx.call is invoked with two arguments when no options are passed, so a
 * plain toHaveBeenCalledWith(action, params) is the right assertion.
 */
function expectCalled(mock: jest.Mock, action: string, params: unknown) {
  expect(mock).toHaveBeenCalledWith(action, params);
}

describe('Test "openapi.apikey" service', () => {
  // Registered before the broker's own afterAll so it runs while the
  // connection is still open (jest runs afterAll hooks in definition order).
  afterAll(async () => {
    await service.adapter.model.deleteMany({ appId: app.appId });
  });

  const { broker, service, contextCallMock } =
    createTestServiceBroker<OpenApiKeyService>(OpenApiKeyService, {
      contextCallMockFn(actionName, params) {
        if (actionName === 'openapi.app.get') {
          return params.appId === app.appId ? { ...app } : null;
        }
        if (actionName === 'openapi.bot.getOrCreateBotAccount') {
          return {
            userId: botUserId,
            email: 'open_x@openapi.msgbyte.com',
            nickname: app.appName,
            avatar: '',
          };
        }
      },
    });

  const ownerMeta = { meta: { userId: ownerId } };

  beforeEach(() => {
    app.capability = ['bot', 'admin'];
  });

  async function createKey(
    scopes: string[] = ['message:read', 'message:write'],
    extra: Record<string, unknown> = {}
  ) {
    return broker.call(
      'openapi.apikey.create',
      { appId: app.appId, name: 'test', scopes, ...extra },
      ownerMeta
    ) as Promise<{
      keyId: string;
      key: string;
      scopes: string[];
      name: string;
      expiresAt?: string;
    }>;
  }

  test('create returns the plaintext key once and stores only a hash', async () => {
    const res = await createKey(['message:write', 'bogus', 'message:read']);

    expect(isApiKey(res.key)).toBe(true);
    expect(res.scopes).toEqual(['message:read', 'message:write']);
    expect(res.name).toBe('test');

    const { keyId, secret } = parseApiKey(res.key);
    expect(res.keyId).toBe(keyId);

    const doc = await service.adapter.model.findOne({ keyId }).lean();
    expect(doc.appId).toBe(app.appId);
    expect(doc.secretHash).toBe(hashApiKeySecret(secret));
    expect(JSON.stringify(doc)).not.toContain(secret);
    expect(doc.revokedAt).toBeUndefined();
    expect(String(doc.createdBy)).toBe(ownerId);
  });

  test('create rejects a caller who does not own the app', async () => {
    await expect(
      broker.call(
        'openapi.apikey.create',
        { appId: app.appId, name: 'x', scopes: ['message:read'] },
        { meta: { userId: strangerId } }
      )
    ).rejects.toThrow();
  });

  test('create rejects an unknown app', async () => {
    await expect(
      broker.call(
        'openapi.apikey.create',
        { appId: 'tc_missing', name: 'x', scopes: ['message:read'] },
        ownerMeta
      )
    ).rejects.toThrow();
  });

  test('create requires at least one known scope', async () => {
    await expect(createKey([])).rejects.toThrow();
    await expect(createKey(['bogus'])).rejects.toThrow();
  });

  test('create requires the bot capability', async () => {
    app.capability = ['oauth'];
    await expect(createKey(['message:read'])).rejects.toThrow();
  });

  test('admin scope requires the admin capability', async () => {
    app.capability = ['bot'];
    await expect(createKey(['admin'])).rejects.toThrow();

    app.capability = ['bot', 'admin'];
    const res = await createKey(['admin']);
    expect(res.scopes).toEqual(['admin']);
  });

  test('create accepts an expiry in days', async () => {
    const before = Date.now();
    const res = await createKey(['message:read'], { expiresInDays: 7 });
    const expiresAt = new Date(res.expiresAt).valueOf();
    expect(expiresAt).toBeGreaterThan(before + 6 * 24 * 60 * 60 * 1000);
    expect(expiresAt).toBeLessThan(before + 8 * 24 * 60 * 60 * 1000);
  });

  test('list shows keys without secrets, owner only', async () => {
    const created = await createKey(['group:read']);

    const list: any[] = await broker.call(
      'openapi.apikey.list',
      { appId: app.appId },
      ownerMeta
    );
    const item = list.find((k) => k.keyId === created.keyId);
    expect(item).toBeDefined();
    expect(item.scopes).toEqual(['group:read']);
    expect(item.revoked).toBe(false);
    expect(item).not.toHaveProperty('secretHash');
    expect(item).not.toHaveProperty('key');

    await expect(
      broker.call(
        'openapi.apikey.list',
        { appId: app.appId },
        { meta: { userId: strangerId } }
      )
    ).rejects.toThrow();
  });

  test('resolve returns the bot user and effective scopes', async () => {
    const created = await createKey(['group:manage', 'message:write']);

    const res: any = await broker.call('openapi.apikey.resolve', {
      key: created.key,
    });

    expect(res.user._id).toBe(botUserId);
    expect(res.user.nickname).toBe(app.appName);
    // scopes come back in catalog order, not request order
    expect(res.apiKey).toEqual({
      keyId: created.keyId,
      appId: app.appId,
      scopes: ['message:write', 'group:manage'],
    });

    expectCalled(contextCallMock, 'openapi.bot.getOrCreateBotAccount', {
      appId: app.appId,
    });
  });

  test('resolve rejects a wrong secret, a malformed key and an unknown key', async () => {
    const created = await createKey(['message:read']);
    const { keyId } = parseApiKey(created.key);

    const flipped =
      created.key.slice(0, -1) + (created.key.endsWith('a') ? 'b' : 'a');
    await expect(
      broker.call('openapi.apikey.resolve', { key: flipped })
    ).rejects.toThrow();

    await expect(
      broker.call('openapi.apikey.resolve', { key: 'tck_short' })
    ).rejects.toThrow();

    await service.adapter.model.deleteOne({ keyId });
    await expect(
      broker.call('openapi.apikey.resolve', { key: created.key })
    ).rejects.toThrow();
  });

  test('revoke stops resolution immediately', async () => {
    const created = await createKey(['message:read']);

    await expect(
      broker.call(
        'openapi.apikey.revoke',
        { appId: app.appId, keyId: created.keyId },
        { meta: { userId: strangerId } }
      )
    ).rejects.toThrow();

    await broker.call(
      'openapi.apikey.revoke',
      { appId: app.appId, keyId: created.keyId },
      ownerMeta
    );

    const doc = await service.adapter.model.findOne({ keyId: created.keyId });
    expect(doc.revokedAt).toBeInstanceOf(Date);

    await expect(
      broker.call('openapi.apikey.resolve', { key: created.key })
    ).rejects.toThrow();

    const list: any[] = await broker.call(
      'openapi.apikey.list',
      { appId: app.appId },
      ownerMeta
    );
    expect(list.find((k) => k.keyId === created.keyId).revoked).toBe(true);
  });

  test('an expired key does not resolve', async () => {
    const created = await createKey(['message:read']);
    await service.adapter.model.updateOne(
      { keyId: created.keyId },
      { expiresAt: new Date(Date.now() - 1000) }
    );

    await expect(
      broker.call('openapi.apikey.resolve', { key: created.key })
    ).rejects.toThrow();
  });

  test('resolve fails when the app lost the bot capability', async () => {
    const created = await createKey(['message:read']);
    app.capability = ['oauth'];

    await expect(
      broker.call('openapi.apikey.resolve', { key: created.key })
    ).rejects.toThrow();
  });

  test('resolve drops the admin scope when the app lost the admin capability', async () => {
    const created = await createKey(['admin', 'message:read']);
    app.capability = ['bot'];

    const res: any = await broker.call('openapi.apikey.resolve', {
      key: created.key,
    });
    expect(res.apiKey.scopes).toEqual(['message:read']);
  });

  test('resolve records lastUsedAt', async () => {
    const created = await createKey(['message:read']);
    await broker.call('openapi.apikey.resolve', { key: created.key });

    // the touch is fire-and-forget; give it a tick
    await new Promise((r) => setTimeout(r, 50));
    const doc = await service.adapter.model.findOne({ keyId: created.keyId });
    expect(doc.lastUsedAt).toBeInstanceOf(Date);
  });

  test('scopes lists the catalog', async () => {
    const res: any[] = await broker.call(
      'openapi.apikey.scopes',
      {},
      { meta: { userId: SYSTEM_USERID } }
    );
    expect(res.map((s) => s.name)).toContain('group:manage');
    expect(res.find((s) => s.name === 'admin').description).toMatch(/admin/i);
  });
});
