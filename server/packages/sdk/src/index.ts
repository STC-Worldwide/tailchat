export { defaultBrokerConfig } from './runner/moleculer.config';
export { TcService } from './services/base';
export { TcBroker } from './services/broker';
export type { TcDbService } from './services/mixins/db.mixin';
export { TcMinioService } from './services/mixins/minio.mixin';
export type {
  TcContext,
  TcPureContext,
  PureContext,
  UserJWTPayload,
  GroupBaseInfo,
  PureServiceSchema,
  PureService,
  PanelFeature,
} from './services/types';
export { parseLanguageFromHead } from './services/lib/i18n/parser';
export { t } from './services/lib/i18n';
export { ApiGatewayMixin } from './services/lib/moleculer-web';
export * as ApiGatewayErrors from './services/lib/moleculer-web/errors';
export * from './services/lib/errors';
export { PERMISSION, allPermission } from './services/lib/role';
export {
  API_KEY_PREFIX,
  API_KEY_ID_LENGTH,
  API_KEY_SECRET_LENGTH,
  API_KEY_LENGTH,
  API_KEY_ALPHABET,
  API_KEY_ADMIN_SCOPE,
  API_KEY_SCOPES,
  apiKeyScopeNames,
  isApiKeyScope,
  filterApiKeyScopes,
  expandApiKeyScopes,
  matchActionScopes,
  scopesForAction,
  isApiKey,
  parseApiKey,
  formatApiKey,
  hashApiKeySecret,
  verifyApiKeySecret,
} from './services/lib/apikey';
export type {
  ApiKeyScope,
  ApiKeyScopeDefinition,
  ApiKeyMeta,
} from './services/lib/apikey';
export { call } from './services/lib/call';
export { isServerAdmin } from './services/lib/admin';
export {
  config,
  buildUploadUrl,
  builtinAuthWhitelist,
  checkEnvTrusty,
} from './services/lib/settings';

// struct
export type {
  MessageStruct,
  MessageReactionStruct,
  MessageMetaStruct,
  InboxStruct,
} from './structs/chat';
export type { BuiltinEventMap } from './structs/events';
export type {
  GroupStruct,
  GroupRoleStruct,
  GroupPanelStruct,
  GroupPanelMeta,
  GroupPanelSlowMode,
} from './structs/group';
export {
  GroupPanelType,
  GROUP_PANEL_SLOW_MODE_INTERVALS,
  GROUP_PANEL_SLOW_MODE_MAX_MESSAGES,
  getGroupPanelSlowMode,
  isGroupPanelSlowMode,
} from './structs/group';
export { userType } from './structs/user';
export type { UserStruct, UserType, UserStructWithToken } from './structs/user';

// db
export * as db from './db';

// openapi
export * from './openapi';

export * from './const';

// other
export { Utils, Errors } from 'moleculer';
export type { BrokerOptions } from 'moleculer';

/**
 * 统一处理未捕获的错误, 防止直接把应用打崩
 * NOTICE: 未经测试
 */
process.on('unhandledRejection', (reason, promise) => {
  console.error('unhandledRejection', reason);
});
process.on('uncaughtException', (error, origin) => {
  console.error('uncaughtException', error);
});
