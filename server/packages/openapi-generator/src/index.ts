import globby from 'globby';
import {
  TcBroker,
  TcService,
  API_KEY_SCOPES,
  apiKeyScopeNames,
  builtinAuthWhitelist,
} from 'tailchat-server-sdk';
import {
  generateOpenapiPath,
  SECURITY_API_KEY_BEARER,
  SECURITY_API_KEY_HEADER,
  SECURITY_USER_TOKEN,
} from './generateOpenapiPath';
import type { OpenAPIObject } from 'openapi3-ts/oas31';
import SwaggerParser from '@apidevtools/swagger-parser';
import fs from 'fs-extra';
import path from 'path';
import 'ts-node/register';

/**
 * Walk every service and describe its published actions.
 *
 * Run from the server directory: `pnpm gen:openapi`. Services register their
 * database mixin during construction, so MONGO_URL must be set (no connection
 * is opened, the adapter is only instantiated).
 */
async function scanServices(): Promise<OpenAPIObject> {
  const packageJsonPath = path.resolve(__dirname, '../../../../package.json');
  const version = (await fs.readJson(packageJsonPath)).version || '0.0.0';
  const serviceFiles = await globby(
    ['./services/**/*.service.ts', './plugins/**/*.service.ts'],
    {
      absolute: true,
    }
  );

  console.log('Service List:', serviceFiles);

  const scopeDescription = apiKeyScopeNames
    .map((name) => `- \`${name}\`: ${API_KEY_SCOPES[name].description}`)
    .join('\n');

  const openapiObj: OpenAPIObject = {
    openapi: '3.1.0',
    info: {
      title: 'Tailchat API',
      version,
      description: [
        'Every published Moleculer action is reachable as `POST /api/<service>/<action>` with a JSON body.',
        'Paths below omit the `/api` prefix. The same actions are callable as socket.io events named `<service>.<action>`.',
        '',
        'Authenticate with a user JWT in `X-Token`, or with a personal access token in `Authorization: Bearer <key>` or `X-Api-Key`.',
        'A token acts as the user who created it, so it reaches exactly what that user reaches, and may only call actions permitted by its scopes (`x-tailchat-scopes` on each operation):',
        '',
        scopeDescription,
        '',
        'Rate limit: `API_RATE_LIMIT` requests per minute per credential (default 600), reported in `X-Rate-Limit-*` headers; HTTP 429 when exceeded.',
        'Responses are `{ "code": <http status>, "data": <result> }`.',
      ].join('\n'),
    },
    servers: [
      { url: '/api', description: 'same origin' },
      { url: 'http://localhost:11000/api', description: 'local development' },
    ],
    components: {
      securitySchemes: {
        [SECURITY_USER_TOKEN]: {
          type: 'apiKey',
          in: 'header',
          name: 'X-Token',
          description: 'User JWT from /user/login',
        },
        [SECURITY_API_KEY_BEARER]: {
          type: 'http',
          scheme: 'bearer',
          description:
            'Personal access token (tck_...) from /user/apikey/create. It acts as the user who created it; scopes listed per operation narrow it further.',
        },
        [SECURITY_API_KEY_HEADER]: {
          type: 'apiKey',
          in: 'header',
          name: 'X-Api-Key',
          description:
            'Personal access token (tck_...), alternative to the bearer form.',
        },
      },
    },
    paths: {},
  };
  const broker = new TcBroker({
    logger: false,
  });
  for (const servicePath of serviceFiles) {
    const { default: serviceCls } = await import(servicePath);

    if (serviceCls && TcService.prototype.isPrototypeOf(serviceCls.prototype)) {
      const service: TcService = new serviceCls(broker);

      openapiObj.paths = {
        ...openapiObj.paths,
        ...generateOpenapiPath(service, builtinAuthWhitelist),
      };
    }
  }
  broker.stop();

  await SwaggerParser.validate(JSON.parse(JSON.stringify(openapiObj)));

  return openapiObj;
}

scanServices()
  .then(async (openapiObj) => {
    await fs.writeJSON('./openapi.json', openapiObj, {
      spaces: 2,
    });
    console.log(
      'generate completed, if process not exist auto, you can exit it by yourself'
    );
    process.exit(0);
  })
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
