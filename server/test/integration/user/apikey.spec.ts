import { createTestServiceBroker } from '../../utils';
import UserApiKeyService from '../../../services/core/user/apikey.service';
import { Types } from 'mongoose';
import { hashApiKeySecret, isApiKey, parseApiKey } from 'tailchat-server-sdk';
import { TEST_ADMIN_USER_ID } from '../../constants';

const ownerId = String(new Types.ObjectId());
const strangerId = String(new Types.ObjectId());

/**
 * A personal access token acts as its owner, so these tests are about one
 * question: can a key ever do more than the user who minted it?
 */
describe('Test "user.apikey" service', () => {
  // Registered before the broker's own afterAll so it runs while the
  // connection is still open (jest runs afterAll hooks in definition order).
  afterAll(async () => {
    await service.adapter.model.deleteMany({
      userId: { $in: [ownerId, strangerId, TEST_ADMIN_USER_ID] },
    });
  });

  const banned = { value: false };

  const { broker, service } = createTestServiceBroker<UserApiKeyService>(
    UserApiKeyService,
    {
      contextCallMockFn(actionName, params) {
        if (actionName === 'user.getUserInfo') {
          return {
            _id: params.userId,
            nickname: 'owner',
            email: 'owner@example.com',
            avatar: '',
            banned: banned.value,
          };
        }
      },
    }
  );

  const ownerMeta = { meta: { userId: ownerId } };

  beforeEach(() => {
    banned.value = false;
  });

  async function createKey(
    scopes: string[] = ['message:read', 'message:write'],
    meta: Record<string, unknown> = ownerMeta.meta,
    extra: Record<string, unknown> = {}
  ) {
    return broker.call<any, any>(
      'user.apikey.create',
      { name: 'agent', scopes, ...extra },
      { meta }
    );
  }

  test('creates a key that is returned once and stored only as a hash', async () => {
    const res = await createKey();

    expect(isApiKey(res.key)).toBe(true);
    expect(res.keyId).toHaveLength(12);
    expect(res.scopes).toEqual(['message:read', 'message:write']);
    expect(res.revoked).toBe(false);

    const parsed = parseApiKey(res.key)!;
    expect(parsed.keyId).toBe(res.keyId);

    const doc = await service.adapter.model.findOne({ keyId: res.keyId });
    expect(String(doc!.userId)).toBe(ownerId);
    expect(doc!.secretHash).toBe(hashApiKeySecret(parsed.secret));
    // the plaintext secret must appear nowhere in the record
    expect(JSON.stringify(doc!.toJSON())).not.toContain(parsed.secret);
  });

  test('requires at least one known scope', async () => {
    await expect(createKey([])).rejects.toThrow();
    await expect(createKey(['not-a-scope'])).rejects.toThrow();
  });

  test('refuses the admin scope to a user who is not a server administrator', async () => {
    await expect(createKey(['admin'])).rejects.toThrow(/server administrator/);
  });

  test('allows the admin scope to a server administrator', async () => {
    const res = await createKey(['admin'], { userId: TEST_ADMIN_USER_ID });
    expect(res.scopes).toEqual(['admin']);
  });

  test('lists only the caller own keys and revokes permanently', async () => {
    const mine = await createKey();
    await createKey(['message:read'], { userId: strangerId });

    const list: any[] = await broker.call('user.apikey.list', {}, ownerMeta);
    expect(list.map((k) => k.keyId)).toContain(mine.keyId);
    expect(list.every((k) => k.revoked === false)).toBe(true);

    // a stranger cannot revoke it, and cannot learn whether it exists
    await expect(
      broker.call(
        'user.apikey.revoke',
        { keyId: mine.keyId },
        { meta: { userId: strangerId } }
      )
    ).rejects.toThrow(/Not found/);

    await broker.call('user.apikey.revoke', { keyId: mine.keyId }, ownerMeta);
    const after = await service.adapter.model.findOne({ keyId: mine.keyId });
    expect(after!.revokedAt).toBeInstanceOf(Date);
  });

  describe('resolve', () => {
    test('returns the owning user, not a bot account', async () => {
      const created = await createKey();

      const resolved: any = await broker.call('user.apikey.resolve', {
        key: created.key,
      });

      expect(resolved.user._id).toBe(ownerId);
      expect(resolved.user.nickname).toBe('owner');
      expect(resolved.apiKey).toEqual({
        keyId: created.keyId,
        userId: ownerId,
        scopes: ['message:read', 'message:write'],
      });
    });

    test('refuses a malformed, unknown, revoked or expired key', async () => {
      await expect(
        broker.call('user.apikey.resolve', { key: 'nonsense' })
      ).rejects.toThrow(/Invalid API key/);

      const unknown = await createKey();
      await service.adapter.model.deleteOne({ keyId: unknown.keyId });
      await expect(
        broker.call('user.apikey.resolve', { key: unknown.key })
      ).rejects.toThrow(/Invalid API key/);

      const revoked = await createKey();
      await broker.call(
        'user.apikey.revoke',
        { keyId: revoked.keyId },
        ownerMeta
      );
      await expect(
        broker.call('user.apikey.resolve', { key: revoked.key })
      ).rejects.toThrow(/revoked/);

      const expired = await createKey(['message:read'], ownerMeta.meta);
      await service.adapter.model.updateOne(
        { keyId: expired.keyId },
        { expiresAt: new Date(Date.now() - 1000) }
      );
      await expect(
        broker.call('user.apikey.resolve', { key: expired.key })
      ).rejects.toThrow(/expired/);
    });

    test('a wrong secret against a real key id is refused', async () => {
      const created = await createKey();
      const tampered =
        created.key.slice(0, 16) + 'z'.repeat(created.key.length - 16);

      await expect(
        broker.call('user.apikey.resolve', { key: tampered })
      ).rejects.toThrow(/Invalid API key/);
    });

    test('a banned owner cannot authenticate', async () => {
      const created = await createKey();
      banned.value = true;

      await expect(
        broker.call('user.apikey.resolve', { key: created.key })
      ).rejects.toThrow(/banned/);
    });

    test('drops the admin scope when the owner is no longer an administrator', async () => {
      const created = await createKey(['admin'], {
        userId: TEST_ADMIN_USER_ID,
      });

      // the key outlives the grant: reassign it to an ordinary user
      await service.adapter.model.updateOne(
        { keyId: created.keyId },
        { userId: ownerId }
      );

      const resolved: any = await broker.call('user.apikey.resolve', {
        key: created.key,
      });
      expect(resolved.apiKey.scopes).toEqual([]);
    });
  });
});
