import type { IncomingMessage, ServerResponse } from 'http';
import _ from 'lodash';
import { TcSocketIOService } from '../../mixins/socketio.mixin';
import {
  TcService,
  UserJWTPayload,
  config,
  t,
  parseLanguageFromHead,
  builtinAuthWhitelist,
  PureContext,
  ApiGatewayMixin,
  ApiGatewayErrors,
  ApiKeyMeta,
  isApiKey,
  matchActionScopes,
} from 'tailchat-server-sdk';
import { TcHealth } from '../../mixins/health.mixin';
import type { Readable } from 'stream';
import { checkPathMatch, isRevalidatingStaticAsset } from '../../lib/utils';
import { buildRateLimitKey, extractCredential } from '../../lib/credential';
import serve from 'serve-static';
import accepts from 'accepts';
import send from 'send';
import path from 'path';
import mime from 'mime';

function getHeaderValue(
  header: string | string[] | undefined
): string | undefined {
  return Array.isArray(header) ? header[0] : header;
}

function getRequestIp(req: IncomingMessage): string | undefined {
  const forwardedFor = getHeaderValue(req.headers['x-forwarded-for'])
    ?.split(',')[0]
    ?.trim();
  const realIp = getHeaderValue(req.headers['x-real-ip'])?.trim();

  return forwardedFor || realIp || req.socket.remoteAddress;
}

export default class ApiService extends TcService {
  authWhitelist = [];

  get serviceName() {
    return 'gateway';
  }

  onInit() {
    this.registerMixin(ApiGatewayMixin);
    this.registerMixin(
      TcSocketIOService({
        userAuth: async (token) => {
          const { user, apiKey } = await this.resolveCredential(token);

          return { ...user, apiKey };
        },
        disableMsgpack: config.feature.disableMsgpack,
      })
    );
    this.registerMixin(TcHealth());

    // More info about settings: https://moleculer.services/docs/0.14/moleculer-web.html
    this.registerSetting('port', config.port);
    this.registerSetting('routes', this.getRoutes());
    // Do not log client side errors (does not log an error response when the error.code is 400<=X<500)
    this.registerSetting('log4XXResponses', false);
    // Logging the request parameters. Set to any log level to enable it. E.g. "info"
    this.registerSetting('logRequestParams', null);
    // Logging the response data. Set to any log level to enable it. E.g. "info"
    this.registerSetting('logResponseData', null);
    // Serve assets from "public" folder
    // this.registerSetting('assets', {
    //   folder: 'public',
    //   // Options to `server-static` module
    //   options: {},
    // });
    this.registerSetting('cors', {
      // Configures the Access-Control-Allow-Origin CORS header.
      origin: '*',
      // Configures the Access-Control-Allow-Methods CORS header.
      methods: ['GET', 'OPTIONS', 'POST', 'PUT', 'DELETE'],
      // Configures the Access-Control-Allow-Headers CORS header.
      allowedHeaders: ['X-Token', 'Content-Type'],
      // Configures the Access-Control-Expose-Headers CORS header.
      exposedHeaders: [],
      // Configures the Access-Control-Allow-Credentials CORS header.
      credentials: false,
      // Configures the Access-Control-Max-Age CORS header.
      maxAge: 3600,
    });
    // Rate limiting is configured per route in getRoutes() (see the /api
    // route) so the key function can use the presented credential.

    this.registerMethod('authorize', this.authorize);

    this.registerEventListener(
      'gateway.auth.addWhitelists',
      ({ urls = [] }) => {
        this.logger.info('Add auth whitelist:', urls);
        this.authWhitelist.push(...urls);
      }
    );
  }

  getRoutes() {
    return [
      // /api
      {
        path: '/api',
        whitelist: [
          // Access to any actions in all services under "/api" URL
          '**',
        ],
        // Route-level Express middlewares. More info: https://moleculer.services/docs/0.14/moleculer-web.html#Middlewares
        use: [],
        // Enable/disable parameter merging method. More info: https://moleculer.services/docs/0.14/moleculer-web.html#Disable-merging
        mergeParams: true,

        // Enable authentication. Implement the logic into `authenticate` method. More info: https://moleculer.services/docs/0.14/moleculer-web.html#Authentication
        authentication: false,

        // Enable authorization. Implement the logic into `authorize` method. More info: https://moleculer.services/docs/0.14/moleculer-web.html#Authorization
        authorization: true,

        // Per-credential rate limit (per IP before login). The store is
        // in-memory per gateway node: exact with one gateway, `limit x nodes`
        // with several. Fails open. API_RATE_LIMIT=0 disables it.
        rateLimit:
          config.apiRateLimit > 0
            ? {
                window: 60 * 1000,
                limit: config.apiRateLimit,
                headers: true,
                key: (req: IncomingMessage) =>
                  buildRateLimitKey(req.headers, getRequestIp(req)),
              }
            : undefined,

        // The auto-alias feature allows you to declare your route alias directly in your services.
        // The gateway will dynamically build the full routes from service schema.
        autoAliases: true,

        aliases: {},
        /**
         * Before call hook. You can check the request.
         * @param {PureContext} ctx
         * @param {Object} route
         * @param {IncomingMessage} req
         * @param {ServerResponse} res
         * @param {Object} data*/
        onBeforeCall(
          ctx: PureContext<
            any,
            { userAgent?: string; language: string; ip?: string }
          >,
          route: object,
          req: IncomingMessage,
          res: ServerResponse
        ) {
          // Set request headers to context meta
          ctx.meta.userAgent = req.headers['user-agent'];
          ctx.meta.ip = getRequestIp(req);
          ctx.meta.language = parseLanguageFromHead(
            req.headers['accept-language']
          );
        },

        /**
         * After call hook. You can modify the data.
         * @param {PureContext} ctx
         * @param {Object} route
         * @param {IncomingMessage} req
         * @param {ServerResponse} res
         * @param {Object} data
         *
         */
        onAfterCall(
          ctx: PureContext,
          route: object,
          req: IncomingMessage,
          res: ServerResponse,
          data: object
        ) {
          // Async function which return with Promise
          res.setHeader('X-Node-ID', ctx.nodeID);

          if (data && data['__raw']) {
            // 如果返回值有__raw, 则视为返回了html片段
            if (data['header']) {
              Object.entries(data['header']).forEach(([key, value]) => {
                res.setHeader(key, String(value));
              });
            }

            res.write(data['html'] ?? '');
            res.end();
            return;
          }

          return { code: res.statusCode, data };
        },

        // Calling options. More info: https://moleculer.services/docs/0.14/moleculer-web.html#Calling-options
        callingOptions: {},

        bodyParsers: {
          json: {
            strict: false,
            limit: '1MB',
          },
          urlencoded: {
            extended: true,
            limit: '1MB',
          },
        },

        // Mapping policy setting. More info: https://moleculer.services/docs/0.14/moleculer-web.html#Mapping-policy
        mappingPolicy: 'all', // Available values: "all", "restrict"

        // Enable/disable logging
        logging: true,
      },
      // /upload
      {
        // Reference: https://github.com/moleculerjs/moleculer-web/blob/master/examples/file/index.js
        path: '/upload',
        // You should disable body parsers
        bodyParsers: {
          json: false,
          urlencoded: false,
        },

        authentication: false,
        authorization: true,

        aliases: {
          // File upload from HTML form
          'POST /': {
            type: 'multipart',
            action: 'file.save',
          },

          // File upload from AJAX or cURL
          'PUT /': {
            type: 'stream',
            action: 'file.save',
          },
        },

        // https://github.com/mscdex/busboy#busboy-methods
        busboyConfig: {
          limits: {
            files: 1,
            fileSize: config.storage.limit,
          },
          onPartsLimit(busboy, alias, svc) {
            this.logger.info('Busboy parts limit!', busboy);
          },
          onFilesLimit(busboy, alias, svc) {
            this.logger.info('Busboy file limit!', busboy);
          },
          onFieldsLimit(busboy, alias, svc) {
            this.logger.info('Busboy fields limit!', busboy);
          },
        },

        callOptions: {
          meta: {
            a: 5,
          },
        },

        mappingPolicy: 'restrict',
      },
      // /health
      {
        path: '/health',
        aliases: {
          'GET /': 'gateway.health',
        },
        mappingPolicy: 'restrict',
      },
      // /static 对象存储文件代理
      {
        path: '/static',
        authentication: false,
        authorization: false,
        aliases: {
          async 'GET /:objectName+'(
            this: TcService,
            req: IncomingMessage,
            res: ServerResponse
          ) {
            const objectName = _.get(req, '$params.objectName');

            try {
              const result: Readable = await this.broker.call(
                'file.get',
                {
                  objectName,
                },
                {
                  parentCtx: _.get(req, '$ctx'),
                }
              );

              const ext = path.extname(objectName);
              if (ext) {
                res.setHeader('Content-Type', mime.getType(ext));
              }

              // 因为对象存储的对象名都是以文件内容hash存储的，因此过期时间可以设置很大
              res.setHeader('Cache-Control', 'public, max-age=315360000'); // 10 years => 60 * 60 * 24 * 365 * 10

              result.pipe(res);
            } catch (err) {
              this.logger.error(err);
              res.write('static file not found');
              res.end();
            }
          },
        },
        mappingPolicy: 'restrict',
      },
      // 静态文件代理
      {
        path: '/',
        authentication: false,
        authorization: false,
        use: [
          serve('public', {
            cacheControl: true,
            maxAge: '1d', // 1 day for public file, include plugins
            setHeaders(res: ServerResponse, path: string, stat: any) {
              res.setHeader('Access-Control-Allow-Origin', '*'); // 允许跨域

              // 插件入口(index.js / manifest.json)的文件名不带 hash, 一天的
              // max-age 会把每个浏览器钉在它第一次见到的那个插件版本上 ——
              // 插件修好了, 用户最多还要等 24 小时才看得到。带 hash 的
              // chunk 不受影响, 新构建本来就是新文件名。
              if (isRevalidatingStaticAsset(path)) {
                res.setHeader(
                  'Cache-Control',
                  'public, max-age=0, must-revalidate'
                );
              }
            },
          }),
        ],
        onError(req: IncomingMessage, res: ServerResponse, err) {
          if (
            String(req.method).toLowerCase() === 'get' && // get请求
            accepts(req).types(['html']) && // 且请求html页面
            err.code === 404
          ) {
            // 如果没有找到, 则返回index.html(for spa)
            this.logger.info('fallback to fe entry file');
            send(req, './public/index.html', { root: process.cwd() }).pipe(res);
          }
        },
        whitelist: [],
        autoAliases: false,
      },
    ];
  }

  /**
   * 获取鉴权白名单
   * 在白名单中的路由会被跳过
   */
  getAuthWhitelist() {
    return _.uniq([...builtinAuthWhitelist, ...this.authWhitelist]);
  }

  /**
   * jwt秘钥
   */
  get jwtSecretKey() {
    return config.secret;
  }

  /**
   * Turn a presented credential into an identity.
   *
   * Something shaped like a personal access token goes to `user.apikey.resolve`
   * and comes back as the app's bot user plus the key's scopes; anything else
   * is a user JWT. Shared by the HTTP route and the socket handshake.
   */
  async resolveCredential(
    credential: string
  ): Promise<{ user: UserJWTPayload; apiKey?: ApiKeyMeta }> {
    if (isApiKey(credential)) {
      if (!config.enableOpenapi) {
        throw new Error('OpenAPI is disabled');
      }

      const resolved: { user: UserJWTPayload; apiKey: ApiKeyMeta } =
        await this.broker.call('user.apikey.resolve', {
          key: credential,
        });

      return { user: resolved.user, apiKey: resolved.apiKey };
    }

    const user: UserJWTPayload = await this.broker.call('user.resolveToken', {
      token: credential,
    });

    return { user };
  }

  async authorize(
    ctx: PureContext<{}, any>,
    route: unknown,
    req: IncomingMessage & { $action?: { name?: string } }
  ) {
    if (checkPathMatch(this.getAuthWhitelist(), req.url)) {
      return null;
    }

    const credential = extractCredential(req.headers);

    if (typeof credential !== 'string') {
      throw new ApiGatewayErrors.UnAuthorizedError(
        ApiGatewayErrors.ERR_NO_TOKEN,
        {
          error: 'No Token',
        }
      );
    }

    let user: UserJWTPayload;
    let apiKey: ApiKeyMeta | undefined;
    try {
      ({ user, apiKey } = await this.resolveCredential(credential));

      if (!(user && user._id)) {
        throw new Error(t('Token不合规'));
      }
    } catch (err) {
      throw new ApiGatewayErrors.UnAuthorizedError(
        ApiGatewayErrors.ERR_INVALID_TOKEN,
        {
          error: 'Invalid Token:' + String(err),
        }
      );
    }

    // Reduce user fields (it will be transferred to other nodes)
    ctx.meta.user = _.pick(user, ['_id', 'nickname', 'email', 'avatar']);
    ctx.meta.token = credential;
    ctx.meta.userId = user._id;

    if (!apiKey) {
      this.logger.info('[Web] Authenticated via JWT: ', user.nickname);
      return;
    }

    ctx.meta.apiKey = apiKey;

    // The gateway resolves the endpoint before authorize runs, so the action
    // name is known here and an out-of-scope call never reaches the service.
    const actionName = req.$action?.name;
    if (!actionName || !matchActionScopes(actionName, apiKey.scopes)) {
      throw new ApiGatewayErrors.ForbiddenError('API_KEY_SCOPE', {
        error: `API key scopes [${apiKey.scopes.join(', ')}] do not permit ${
          actionName ?? req.url
        }`,
      });
    }

    this.logger.info(
      '[Web] Authenticated via API key:',
      apiKey.keyId,
      user.nickname
    );
  }
}
