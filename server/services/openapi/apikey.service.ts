import {
  TcService,
  TcDbService,
  TcContext,
  PureContext,
  UserJWTPayload,
  config,
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
  parseApiKey,
  verifyApiKeySecret,
} from 'tailchat-server-sdk';
import { customAlphabet } from 'nanoid';
import type { OpenApp } from '../../models/openapi/app';
import type {
  OpenAppApiKey,
  OpenAppApiKeyDocument,
  OpenAppApiKeyModel,
} from '../../models/openapi/apikey';

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

interface OpenApiKeyService
  extends TcService,
    TcDbService<OpenAppApiKeyDocument, OpenAppApiKeyModel> {}

/**
 * OpenApp API keys.
 *
 * A key authenticates as the app's bot user with a fixed set of scopes.
 * Design: docs/superpowers/specs/2026-09-03-tailchat-agent-api-design.md
 */
class OpenApiKeyService extends TcService {
  get serviceName(): string {
    return 'openapi.apikey';
  }

  onInit(): void {
    if (!config.enableOpenapi) {
      return;
    }

    this.registerLocalDb(require('../../models/openapi/apikey').default);

    this.registerAction('create', this.create, {
      params: {
        appId: 'string',
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
    this.registerAction('list', this.list, {
      params: {
        appId: 'string',
      },
    });
    this.registerAction('revoke', this.revoke, {
      params: {
        appId: 'string',
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
   * Create a key. The plaintext is in the response and nowhere else.
   */
  async create(
    ctx: TcContext<{
      appId: string;
      name: string;
      scopes: string[];
      expiresInDays?: number;
    }>
  ): Promise<ApiKeyView & { key: string }> {
    const { appId, name, expiresInDays } = ctx.params;
    const app = await this.getOwnedApp(ctx, appId);

    if (!app.capability.includes('bot')) {
      throw new EntityError(
        'Enable the bot capability before creating API keys'
      );
    }

    const scopes = filterApiKeyScopes(ctx.params.scopes);
    if (scopes.length === 0) {
      throw new EntityError('At least one known scope is required');
    }

    if (
      scopes.includes(API_KEY_ADMIN_SCOPE) &&
      !app.capability.includes('admin')
    ) {
      throw new NoPermissionError(
        'This app does not hold the admin capability'
      );
    }

    const keyId = generateKeyId();
    const secret = generateSecret();
    const expiresAt =
      typeof expiresInDays === 'number'
        ? new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000)
        : undefined;

    const doc = await this.adapter.model.create({
      appId,
      keyId,
      secretHash: hashApiKeySecret(secret),
      name,
      scopes,
      createdBy: ctx.meta.userId,
      expiresAt,
    });

    this.logger.info('[openapi.apikey] created', keyId, 'for app', appId);

    return {
      ...this.toView(doc),
      key: formatApiKey(keyId, secret),
    };
  }

  /**
   * Keys of an app, newest first, without secrets.
   */
  async list(ctx: TcContext<{ appId: string }>): Promise<ApiKeyView[]> {
    const { appId } = ctx.params;
    await this.getOwnedApp(ctx, appId);

    const docs = await this.adapter.model
      .find({ appId })
      .sort({ createdAt: -1 })
      .lean()
      .exec();

    return docs.map((doc) => this.toView(doc));
  }

  /**
   * Revocation is permanent and takes effect on the next request.
   */
  async revoke(
    ctx: TcContext<{ appId: string; keyId: string }>
  ): Promise<boolean> {
    const { appId, keyId } = ctx.params;
    await this.getOwnedApp(ctx, appId);

    const res = await this.adapter.model
      .updateOne(
        { appId, keyId, revokedAt: { $exists: false } },
        { revokedAt: new Date() }
      )
      .exec();

    if (res.matchedCount === 0) {
      const exists = await this.adapter.model.exists({ appId, keyId });
      if (!exists) {
        throw new DataNotFoundError('Not found API key');
      }
      // already revoked: idempotent
    }

    this.logger.info('[openapi.apikey] revoked', keyId, 'for app', appId);

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
   * uncached so revocation and capability changes apply immediately.
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

    const app: OpenApp | null = await ctx.call('openapi.app.get', {
      appId: doc.appId,
    });

    if (!app || !app.capability.includes('bot')) {
      throw new NoPermissionError('App bot capability is disabled');
    }

    const scopes = (doc.scopes ?? []).filter(
      (scope) =>
        scope !== API_KEY_ADMIN_SCOPE || app.capability.includes('admin')
    );

    const bot: {
      userId: string;
      email: string;
      nickname: string;
      avatar: string;
    } = await ctx.call('openapi.bot.getOrCreateBotAccount', {
      appId: doc.appId,
    });

    this.touchLastUsed(doc);

    return {
      user: {
        _id: bot.userId,
        nickname: bot.nickname,
        email: bot.email,
        avatar: bot.avatar,
      },
      apiKey: {
        keyId: doc.keyId,
        appId: doc.appId,
        scopes,
      },
    };
  }

  /**
   * Load the app and check the caller owns it.
   */
  private async getOwnedApp(ctx: TcContext, appId: string): Promise<OpenApp> {
    const app: OpenApp | null = await ctx.call('openapi.app.get', {
      appId,
    });

    if (!app) {
      throw new DataNotFoundError('Not found open app');
    }

    if (String(app.owner) !== String(ctx.meta.userId)) {
      throw new NoPermissionError('Not the owner of this app');
    }

    return app;
  }

  private touchLastUsed(doc: Pick<OpenAppApiKey, '_id' | 'lastUsedAt'>) {
    const last = doc.lastUsedAt ? new Date(doc.lastUsedAt).valueOf() : 0;
    if (Date.now() - last < LAST_USED_TOUCH_INTERVAL) {
      return;
    }

    this.adapter.model
      .updateOne({ _id: doc._id }, { lastUsedAt: new Date() })
      .exec()
      .catch((err) => {
        this.logger.warn('[openapi.apikey] lastUsedAt update failed:', err);
      });
  }

  private toView(
    doc: Pick<
      OpenAppApiKey,
      | 'keyId'
      | 'name'
      | 'scopes'
      | 'createdAt'
      | 'expiresAt'
      | 'lastUsedAt'
      | 'revokedAt'
    >
  ): ApiKeyView {
    return {
      keyId: doc.keyId,
      name: doc.name,
      scopes: doc.scopes ?? [],
      createdAt: doc.createdAt,
      expiresAt: doc.expiresAt ?? undefined,
      lastUsedAt: doc.lastUsedAt ?? undefined,
      revokedAt: doc.revokedAt ?? undefined,
      revoked: Boolean(doc.revokedAt),
    };
  }
}

export default OpenApiKeyService;
