const openAppCapability = [
  'bot', // 机器人
  'webpage', // 网页
  'oauth', // 第三方登录
  'admin', // server administration; only a server admin can grant it
] as const;

export type OpenAppCapability = (typeof openAppCapability)[number];

export interface OpenAppOAuth {
  redirectUrls: string[];
}

export interface OpenAppBot {
  callbackUrl: string;
}

export interface OpenAppApiKeyScope {
  name: string;
  description: string;
  actions: string[];
}

export interface OpenAppApiKey {
  keyId: string;
  name: string;
  scopes: string[];
  createdAt?: string;
  expiresAt?: string;
  lastUsedAt?: string;
  revokedAt?: string;
  revoked: boolean;
}

export interface OpenApp {
  _id: string;
  appId: string;
  appSecret: string;
  appName: string;
  appDesc: string;
  appIcon: string;
  capability: OpenAppCapability[];
  oauth?: OpenAppOAuth;
  bot?: OpenAppBot;

  owner: string;
}
