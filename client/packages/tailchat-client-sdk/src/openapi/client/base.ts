import axios, { AxiosInstance } from 'axios';
import crypto from 'crypto';

export interface TailchatApiKeyOptions {
  /**
   * An OpenApp API key (`tck_...`) created in Open Api -> App -> API keys.
   * The client then needs no login round-trip and is limited to the key's
   * scopes.
   */
  apiKey: string;
}

export class TailchatBaseClient {
  request: AxiosInstance;
  jwt: string | null = null;
  userId: string | null = null;
  loginP: Promise<void>;
  readonly apiKey: string | null = null;
  readonly appId: string;
  readonly appSecret: string;

  /**
   * `new Client(url, { apiKey })` for API keys (recommended), or the legacy
   * `new Client(url, appId, appSecret)` which logs in with the app secret.
   */
  constructor(url: string, options: TailchatApiKeyOptions);
  constructor(url: string, appId: string, appSecret: string);
  constructor(
    public url: string,
    appIdOrOptions: string | TailchatApiKeyOptions,
    appSecret?: string
  ) {
    if (typeof appIdOrOptions === 'object' && appIdOrOptions !== null) {
      if (!url || !appIdOrOptions.apiKey) {
        throw new Error('Require params: apiUrl, apiKey');
      }
      this.apiKey = appIdOrOptions.apiKey;
      this.appId = '';
      this.appSecret = '';
    } else {
      if (!url || !appIdOrOptions || !appSecret) {
        throw new Error(
          'Require params: apiUrl, appId, appSecret. You can set it with env'
        );
      }
      this.appId = appIdOrOptions;
      this.appSecret = appSecret;
    }

    this.request = axios.create({
      baseURL: url,
    });
    this.request.interceptors.request.use(async (val) => {
      if (
        ['post', 'get'].includes(String(val.method).toLowerCase()) &&
        !val.headers['X-Token'] &&
        !val.headers['Authorization']
      ) {
        // 任何请求都尝试增加凭证
        if (this.apiKey) {
          val.headers['Authorization'] = `Bearer ${this.apiKey}`;
        } else if (this.jwt) {
          val.headers['X-Token'] = this.jwt;
        }
      }

      return val;
    });
    this.loginP = this.login();
  }

  /**
   * The value to present as the socket handshake token.
   */
  get credential(): string | null {
    return this.apiKey ?? this.jwt;
  }

  async login() {
    if (this.apiKey) {
      // Nothing to exchange: the key authenticates every request directly.
      // whoami both validates it and tells us which bot user we are.
      try {
        const { userId } = await this.whoami();
        this.userId = userId;
      } catch (err) {
        console.error(err);
        throw new Error(
          `API key rejected, check the key and its scopes (whoami needs user:read)(Error: ${String(
            err
          )})`
        );
      }
      return;
    }

    try {
      console.log('Login...');
      const { data } = await this.request.post('/api/openapi/bot/login', {
        appId: this.appId,
        token: this.getBotToken(),
      });

      // NOTICE: 注意，有30天过期时间，需要定期重新登录以换取新的token
      // 这里先不换
      this.jwt = data.data?.jwt;
      this.userId = data.data?.userId;

      console.log('tailchat openapp login success!');

      // 尝试调用函数
      // this.whoami().then(console.log);
    } catch (err) {
      console.error(err);
      throw new Error(
        `Login failed, please check application credentials or network(Error: ${String(
          err
        )})`
      );
    }
  }

  async waitingForLogin(): Promise<void> {
    await Promise.resolve(this.loginP);
  }

  async call(action: string, params = {}) {
    try {
      if (!(this.apiKey && action === 'user.whoami')) {
        await this.waitingForLogin();
      }
      console.log('Calling:', action);
      const { data } = await this.request.post(
        '/api/' + action.replace(/\./g, '/'),
        params
      );

      return data.data;
    } catch (err: any) {
      console.error('Service Call Failed:', err);
      const data: string = err?.response?.data;
      if (data) {
        throw new Error(
          JSON.stringify({
            action,
            data,
          })
        );
      } else {
        throw err;
      }
    }
  }

  async whoami(): Promise<{
    userAgent: string;
    language: string;
    user: {
      _id: string;
      nickname: string;
      email: string;
      avatar: string;
    };
    token: string;
    userId: string;
  }> {
    return this.call('user.whoami');
  }

  getBotToken() {
    return crypto
      .createHash('md5')
      .update(this.appId + this.appSecret)
      .digest('hex');
  }

  /**
   * Send normal message to tailchat
   */
  async sendMessage(payload: {
    converseId: string;
    groupId?: string;
    content: string;
    plain?: string;
    meta?: object;
  }) {
    return this.call('chat.message.sendMessage', payload);
  }

  /**
   * Reply message
   */
  async replyMessage(
    replyInfo: {
      messageId: string;
      author: string;
      content: string;
    },
    payload: {
      converseId: string;
      groupId?: string;
      content: string;
      plain?: string;
      meta?: object;
    }
  ) {
    return this.sendMessage({
      ...payload,
      meta: {
        ...payload.meta,
        mentions: [replyInfo.author],
        reply: {
          _id: replyInfo.messageId,
          author: replyInfo.author,
          content: replyInfo.content,
        },
      },
      content: `[at=${replyInfo.author}][/at] ${payload.content}`,
    });
  }
}
