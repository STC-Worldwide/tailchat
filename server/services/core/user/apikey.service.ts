import {
  TcService,
  TcDbService,
  TcContext,
  PureContext,
  UserJWTPayload,
  EntityError,
  NoPermissionError,
  DataNotFoundError,
  ApiKeyMeta,
  API_KEY_ADMIN_SCOPE,
  API_KEY_ALPHABET,
  API_KEY_ID_LENGTH,
  API_KEY_SCOPES,
  API_KEY_SECRET_LENGTH,
  apiKeyScopeNames,
  filterApiKeyScopes,
  formatApiKey,
  hashApiKeySecret,
  isServerAdmin,
  parseApiKey,
  verifyApiKeySecret,
} from 'tailchat-server-sdk';
import { customAlphabet } from 'nanoid';
import type {
  UserApiKeyDocument,
  UserApiKeyModel,
} from '../../../models/user/apikey';

const generateKeyId = customAlphabet(API_KEY_ALPHABET, API_KEY_ID_LENGTH);
const generateSecret = customAlphabet(API_KEY_ALPHABET, API_KEY_SECRET_LENGTH);

/**
 * lastUsedAt is written at most this often per key.
 */
const LAST_USED_TOUCH_INTERVAL = 60 * 1000;

interface ApiKeyView {
  keyId: string;
  name: string;
  scopes: string[];
  createdAt?: Date;
  expiresAt?: Date;
  lastUsedAt?: Date;
  revokedAt?: Date;
  revoked: boolean;
}

interface UserApiKeyService
  extends TcService,
    TcDbService<UserApiKeyDocument, UserApiKeyModel> {}

/**
 * Personal access tokens.
 *
 * A key acts as the user who created it, narrowed by its scopes. There is no
 * application and no bot account: an agent holding a key is the user, sees
 * exactly their groups, and is refused exactly what they would be refused.
 *
 * These actions are reachable only with a real login (a JWT). No scope maps to
 * `user.apikey.*`, so a key can never mint or revoke keys — including its own.
 *
 * Design: docs/superpowers/specs/2026-09-03-tailchat-agent-api-design.md
 */
class UserApiKeyService extends TcService {
  get serviceName(): string {
    return 'user.apikey';
  }

  onInit(): void {
    this.registerLocalDb(require('../../../models/user/apikey').default);

    this.registerAction('create', this.create, {
      params: {
        name: { type: 'string', min: 1, max: 64 },
        scopes: { type: 'array', items: 'string' },
        expiresInDays: {
          type: 'number',
          positive: true,
          integer: true,
          optional: true,
        },
      },
    });
    this.registerAction('list', this.list);
    this.registerAction('revoke', this.revoke, {
      params: {
        keyId: 'string',
      },
    });
    this.registerAction('scopes', this.scopes);
    this.registerAction('resolve', this.resolve, {
      params: {
        key: 'string',
      },
      visibility: 'public',
    });
  }

  /**
   * Create a key for the calling user. The plaintext is in the response and
   * nowhere else.
   */
  async create(
    ctx: TcContext<{
      name: string;
      scopes: string[];
      expiresInDays?: number;
    }>
  ): Promise<ApiKeyView & { key: string }> {
    const { name, expiresInDays } = ctx.params;
    const userId = ctx.meta.userId;

    if (!userId) {
      throw new NoPermissionError('A signed-in user is required');
    }

    const scopes = filterApiKeyScopes(ctx.params.scopes);
    if (scopes.length === 0) {
      throw new EntityError('At least one known scope is required');
    }

    // The admin scope reaches server administration, so it is available only
    // to a server administrator — a key can never exceed its owner.
    if (scopes.includes(API_KEY_ADMIN_SCOPE) && !isServerAdmin(userId)) {
      throw new NoPermissionError(
        'The admin scope is only available to a server administrator'
      );
    }

    const keyId = generateKeyId();
    const secret = generateSecret();
    const expiresAt =
      typeof expiresInDays === 'number'
        ? new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000)
        : undefined;

    const doc = await this.adapter.model.create({
      userId,
      keyId,
      secretHash: hashApiKeySecret(secret),
      name,
      scopes,
      expiresAt,
    });

    this.logger.info('[user.apikey] created', keyId, 'for user', userId);

    return {
      ...this.toView(doc),
      key: formatApiKey(keyId, secret),
    };
  }

  /**
   * The calling user's keys, newest first, without secrets.
   */
  async list(ctx: TcContext): Promise<ApiKeyView[]> {
    const userId = ctx.meta.userId;

    const docs = await this.adapter.model
      .find({ userId })
      .sort({ createdAt: -1 })
      .lean()
      .exec();

    return docs.map((doc) => this.toView(doc));
  }

  /**
   * Revocation is permanent and takes effect on the next request.
   */
  async revoke(ctx: TcContext<{ keyId: string }>): Promise<boolean> {
    const { keyId } = ctx.params;
    const userId = ctx.meta.userId;

    const res = await this.adapter.model
      .updateOne(
        { userId, keyId, revokedAt: { $exists: false } },
        { revokedAt: new Date() }
      )
      .exec();

    if (res.matchedCount === 0) {
      const exists = await this.adapter.model.exists({ userId, keyId });
      if (!exists) {
        // Not found, or owned by someone else: same answer either way, so a
        // key id cannot be probed for existence across accounts.
        throw new DataNotFoundError('Not found API key');
      }
      // already revoked: idempotent
    }

    this.logger.info('[user.apikey] revoked', keyId, 'for user', userId);

    return true;
  }

  /**
   * The scope catalog, for UIs and agents to discover.
   */
  async scopes(): Promise<
    { name: string; description: string; actions: string[] }[]
  > {
    return apiKeyScopeNames.map((name) => ({
      name,
      description: API_KEY_SCOPES[name].description,
      actions: API_KEY_SCOPES[name].actions,
    }));
  }

  /**
   * Turn a presented key into an authenticated identity.
   *
   * Internal only: the gateway and the socket handshake call it. Deliberately
   * uncached so revocation, expiry and a ban apply immediately.
   */
  async resolve(
    ctx: PureContext<{ key: string }>
  ): Promise<{ user: UserJWTPayload; apiKey: ApiKeyMeta }> {
    const parsed = parseApiKey(ctx.params.key);
    if (!parsed) {
      throw new NoPermissionError('Invalid API key');
    }

    const doc = await this.adapter.model
      .findOne({ keyId: parsed.keyId })
      .lean()
      .exec();

    if (!doc || !verifyApiKeySecret(parsed.secret, doc.secretHash)) {
      throw new NoPermissionError('Invalid API key');
    }

    if (doc.revokedAt) {
      throw new NoPermissionError('API key revoked');
    }

    if (doc.expiresAt && new Date(doc.expiresAt).valueOf() <= Date.now()) {
      throw new NoPermissionError('API key expired');
    }

    const userId = String(doc.userId);
    const user: {
      _id: string;
      nickname: string;
      email: string;
      avatar: string;
      banned?: boolean;
    } | null = await ctx.call('user.getUserInfo', { userId });

    if (!user) {
      throw new NoPermissionError('API key owner no longer exists');
    }

    if (user.banned === true) {
      throw new NoPermissionError('API key owner is banned');
    }

    // A key never outranks its owner: if admin rights were removed after the
    // key was minted, the admin scope stops working.
    const scopes = (doc.scopes ?? []).filter(
      (scope) => scope !== API_KEY_ADMIN_SCOPE || isServerAdmin(userId)
    );

    this.touchLastUsed(doc);

    return {
      user: {
        _id: userId,
        nickname: user.nickname,
        email: user.email,
        avatar: user.avatar,
      },
      apiKey: {
        keyId: doc.keyId,
        userId,
        scopes,
      },
    };
  }

  /**
   * Record use, at most once per interval, without blocking the request.
   */
  private touchLastUsed(doc: { _id: unknown; lastUsedAt?: Date }): void {
    const last = doc.lastUsedAt ? new Date(doc.lastUsedAt).valueOf() : 0;
    if (Date.now() - last < LAST_USED_TOUCH_INTERVAL) {
      return;
    }

    this.adapter.model
      .updateOne({ _id: doc._id }, { lastUsedAt: new Date() })
      .exec()
      .catch((err) => {
        this.logger.warn('[user.apikey] failed to record lastUsedAt', err);
      });
  }

  private toView(doc: {
    keyId: string;
    name: string;
    scopes: string[];
    createdAt?: Date;
    expiresAt?: Date;
    lastUsedAt?: Date;
    revokedAt?: Date;
  }): ApiKeyView {
    return {
      keyId: doc.keyId,
      name: doc.name,
      scopes: doc.scopes ?? [],
      createdAt: doc.createdAt,
      expiresAt: doc.expiresAt,
      lastUsedAt: doc.lastUsedAt,
      revokedAt: doc.revokedAt,
      revoked: Boolean(doc.revokedAt),
    };
  }
}

export default UserApiKeyService;
