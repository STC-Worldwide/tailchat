import crypto from 'crypto';
import { Utils } from 'moleculer';

/**
 * API keys for OpenApps.
 *
 * A key acts as the app's bot user and carries named scopes. This module is
 * the single definition of the key format and the scope catalog; the gateway,
 * the socket mixin, the key service, the OpenAPI generator and the client all
 * read it. See docs/superpowers/specs/2026-09-03-tailchat-agent-api-design.md.
 */

export const API_KEY_PREFIX = 'tck_';
export const API_KEY_ID_LENGTH = 12;
export const API_KEY_SECRET_LENGTH = 32;
export const API_KEY_LENGTH =
  API_KEY_PREFIX.length + API_KEY_ID_LENGTH + API_KEY_SECRET_LENGTH;

/**
 * Alphabet for both halves of a key. Alphanumeric only, so a key survives
 * shells, URLs and copy-paste without quoting.
 */
export const API_KEY_ALPHABET =
  '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';

const API_KEY_BODY_RE = new RegExp(
  `^[0-9A-Za-z]{${API_KEY_ID_LENGTH + API_KEY_SECRET_LENGTH}}$`
);

export const API_KEY_ADMIN_SCOPE = 'admin';

export type ApiKeyScope =
  | 'message:read'
  | 'message:write'
  | 'group:read'
  | 'group:manage'
  | 'user:read'
  | 'user:write'
  | 'file'
  | 'plugins'
  | 'admin';

export interface ApiKeyScopeDefinition {
  description: string;
  /**
   * Action-name globs, matched with moleculer's Utils.match:
   * `*` matches one dotted segment, `**` matches any depth.
   */
  actions: string[];
}

export const API_KEY_SCOPES: Record<ApiKeyScope, ApiKeyScopeDefinition> = {
  'message:read': {
    description: 'Read messages, converses, acks and the inbox',
    actions: [
      'chat.message.fetchConverseMessage',
      'chat.message.fetchNearbyMessage',
      'chat.message.getMessage',
      'chat.message.searchMessage',
      'chat.message.getSlowModeStatus',
      'chat.converse.findConverseInfo',
      'chat.converse.findAndJoinRoom',
      'chat.ack.list',
      'chat.ack.all',
      'chat.inbox.all',
    ],
  },
  'message:write': {
    description: 'Send, recall and delete messages, react, open DMs',
    actions: [
      'chat.message.sendMessage',
      'chat.message.recallMessage',
      'chat.message.deleteMessage',
      'chat.message.addReaction',
      'chat.message.removeReaction',
      'chat.message.resetSlowModeCounters',
      'chat.converse.createDMConverse',
      'chat.ack.update',
      'chat.inbox.ack',
      'chat.inbox.clear',
    ],
  },
  'group:read': {
    description: 'List groups, read group info, membership and invites',
    actions: [
      'group.getUserGroups',
      'group.getJoinedGroupAndPanelIds',
      'group.getGroupBasicInfo',
      'group.isGroupOwner',
      'group.isMember',
      'group.getPermissions',
      'group.extra.getGroupData',
      'group.extra.getPanelData',
      'group.invite.getAllGroupInviteCode',
      'group.invite.findInviteByCode',
    ],
  },
  'group:manage': {
    description:
      'Create and configure groups, panels, roles, members and invites (includes group:read)',
    actions: ['group.*', 'group.extra.*', 'group.invite.*'],
  },
  'user:read': {
    description: 'Read the bot identity, user profiles, friends and DM list',
    actions: [
      'user.whoami',
      'user.getUserInfo',
      'user.getUserInfoList',
      'user.searchUserWithUniqueName',
      'user.getUserSettings',
      'friend.getAllFriends',
      'friend.checkIsFriend',
      'user.dmlist.getAllConverse',
    ],
  },
  'user:write': {
    description: 'Update the bot profile and settings, manage friends and DMs',
    actions: [
      'user.updateUserField',
      'user.updateUserExtra',
      'user.setUserSettings',
      'friend.*',
      'friend.request.*',
      'user.dmlist.*',
    ],
  },
  file: {
    description: 'Upload and read files',
    actions: ['file.save', 'file.get', 'file.stat'],
  },
  plugins: {
    description: 'Call backend plugin services',
    actions: ['plugin:**', 'plugin.registry.list'],
  },
  admin: {
    description:
      'Server administration (requires the admin app capability): find, ban and unban users, add members to any group, send system notifications',
    actions: ['openapi.admin.*'],
  },
};

export const apiKeyScopeNames = Object.keys(API_KEY_SCOPES) as ApiKeyScope[];

export function isApiKeyScope(scope: unknown): scope is ApiKeyScope {
  return typeof scope === 'string' && scope in API_KEY_SCOPES;
}

/**
 * Keep only known scopes, in catalog order, without duplicates.
 */
export function filterApiKeyScopes(input: unknown[]): ApiKeyScope[] {
  return apiKeyScopeNames.filter((name) => input.includes(name));
}

/**
 * Expand scope names into the action globs they permit.
 * Unknown scope names are ignored.
 */
export function expandApiKeyScopes(scopes: string[]): string[] {
  const globs: string[] = [];
  for (const scope of scopes) {
    if (isApiKeyScope(scope)) {
      globs.push(...API_KEY_SCOPES[scope].actions);
    }
  }
  return globs;
}

/**
 * Whether a key with the given scopes may call an action.
 */
export function matchActionScopes(
  actionName: string,
  scopes: string[]
): boolean {
  if (typeof actionName !== 'string' || actionName.length === 0) {
    return false;
  }

  return expandApiKeyScopes(scopes).some((glob) =>
    Utils.match(actionName, glob)
  );
}

/**
 * The scopes that permit a given action. Used by the OpenAPI generator.
 */
export function scopesForAction(actionName: string): ApiKeyScope[] {
  return apiKeyScopeNames.filter((scope) =>
    API_KEY_SCOPES[scope].actions.some((glob) => Utils.match(actionName, glob))
  );
}

/**
 * Metadata attached to a request context when it was authenticated with an
 * API key rather than a user JWT.
 */
export interface ApiKeyMeta {
  keyId: string;
  appId: string;
  scopes: string[];
}

/**
 * Cheap shape check: prefix + fixed length + alphabet. Decides which
 * resolver a credential goes to; it does not prove the key exists.
 */
export function isApiKey(raw: unknown): raw is string {
  return (
    typeof raw === 'string' &&
    raw.length === API_KEY_LENGTH &&
    raw.startsWith(API_KEY_PREFIX) &&
    API_KEY_BODY_RE.test(raw.slice(API_KEY_PREFIX.length))
  );
}

export function parseApiKey(
  raw: unknown
): { keyId: string; secret: string } | null {
  if (!isApiKey(raw)) {
    return null;
  }

  const body = raw.slice(API_KEY_PREFIX.length);

  return {
    keyId: body.slice(0, API_KEY_ID_LENGTH),
    secret: body.slice(API_KEY_ID_LENGTH),
  };
}

export function formatApiKey(keyId: string, secret: string): string {
  return `${API_KEY_PREFIX}${keyId}${secret}`;
}

/**
 * SHA-256 of the secret. The secret is 32 random alphanumerics (~190 bits),
 * so a fast hash is the right tool; a password KDF would only add latency.
 */
export function hashApiKeySecret(secret: string): string {
  return crypto.createHash('sha256').update(secret).digest('hex');
}

export function verifyApiKeySecret(
  secret: string,
  secretHash: string
): boolean {
  if (typeof secret !== 'string' || typeof secretHash !== 'string') {
    return false;
  }

  const a = Buffer.from(hashApiKeySecret(secret), 'hex');
  const b = Buffer.from(secretHash, 'hex');

  if (a.length !== b.length || a.length === 0) {
    return false;
  }

  return crypto.timingSafeEqual(a, b);
}
