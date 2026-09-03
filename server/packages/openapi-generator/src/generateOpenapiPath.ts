import _ from 'lodash';
import { scopesForAction } from 'tailchat-server-sdk';
import type { TcService } from 'tailchat-server-sdk';
import type {
  OperationObject,
  PathsObject,
  SchemaObject,
} from 'openapi3-ts/oas31';

/**
 * Security requirement names, must match the schemes declared in index.ts.
 */
export const SECURITY_USER_TOKEN = 'UserToken';
export const SECURITY_API_KEY_BEARER = 'ApiKeyBearer';
export const SECURITY_API_KEY_HEADER = 'ApiKeyHeader';

/**
 * Every published action of a service becomes `POST /<service>/<action>`
 * with a JSON body described by the action's fastest-validator schema.
 */
export function generateOpenapiPath(
  service: TcService,
  authWhitelist: string[] = []
): PathsObject {
  const serviceName = service.serviceName;
  const actions = service.getActionList();

  const paths: PathsObject = {};

  for (const action of actions) {
    const pathName = '/' + servicePath(serviceName) + '/' + action.name;
    const actionName = serviceName + '.' + action.name;
    const isPublic = authWhitelist.includes(pathName);
    const scopes = scopesForAction(actionName);

    const operation: OperationObject = {
      tags: [serviceName],
      operationId: actionName,
      summary: actionName,
      description: describeAccess(isPublic, scopes),
      requestBody: {
        content: {
          'application/json': {
            schema: convertParams(action.params),
          },
        },
      },
      responses: {
        '200': {
          description: 'ok',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  code: { type: 'integer', example: 200 },
                  data: {},
                },
              },
            },
          },
        },
      },
      'x-tailchat-scopes': scopes,
    };

    if (isPublic) {
      operation.security = [];
    } else {
      operation.security = [{ [SECURITY_USER_TOKEN]: [] }];
      if (scopes.length > 0) {
        operation.security.push(
          { [SECURITY_API_KEY_BEARER]: scopes },
          { [SECURITY_API_KEY_HEADER]: scopes }
        );
      }
    }

    paths[pathName] = { post: operation };
  }

  return paths;
}

/**
 * URL segment(s) for a service. The gateway maps `/api/a/b/c` to action
 * `a.b.c`, so `group.invite` is addressed as `/group/invite/...`, which is
 * also how the web client calls it. Plugin services (`plugin:com.x.y`) keep
 * their dotted name as one segment, matching their own clients; the gateway
 * accepts either form.
 */
function servicePath(serviceName: string): string {
  return serviceName.includes(':')
    ? serviceName
    : serviceName.replace(/\./g, '/');
}

function describeAccess(isPublic: boolean, scopes: string[]): string {
  if (isPublic) {
    return 'No authentication required.';
  }
  if (scopes.length === 0) {
    return 'Requires a user token. Not available to API keys.';
  }
  return `Requires a user token, or an API key with one of these scopes: ${scopes.join(
    ', '
  )}.`;
}

/**
 * fastest-validator schema -> JSON Schema, for the shapes Tailchat uses.
 *
 * Handles the shorthand string form ("string", "number|optional"), the
 * object form ({ type, optional, items, props, ... }), and the array-of-
 * alternatives form ([{...}]). Unknown types become an untyped schema so a
 * new validator type never breaks the generator.
 */
export function convertParams(params: Record<string, unknown> | undefined): {
  type: 'object';
  properties: Record<string, SchemaObject>;
  required?: string[];
} {
  const properties: Record<string, SchemaObject> = {};
  const required: string[] = [];

  for (const [name, rule] of Object.entries(params ?? {})) {
    if (name.startsWith('$$')) {
      continue; // validator options such as $$strict
    }

    const { schema, optional } = convertRule(rule);
    properties[name] = schema;
    if (!optional) {
      required.push(name);
    }
  }

  const result: {
    type: 'object';
    properties: Record<string, SchemaObject>;
    required?: string[];
  } = { type: 'object', properties };

  if (required.length > 0) {
    result.required = required;
  }

  return result;
}

interface ConvertedRule {
  schema: SchemaObject;
  optional: boolean;
}

function convertRule(rule: unknown): ConvertedRule {
  if (typeof rule === 'string') {
    return convertRule(parseShorthand(rule));
  }

  if (Array.isArray(rule)) {
    const converted = rule.map((alt) => convertRule(alt));
    if (converted.length === 1) {
      return converted[0];
    }
    return {
      schema: { oneOf: converted.map((c) => c.schema) },
      optional: converted.every((c) => c.optional),
    };
  }

  if (!_.isPlainObject(rule)) {
    return { schema: {}, optional: false };
  }

  const r = rule as Record<string, any>;
  const optional = r.optional === true || r.nullable === true;
  const schema = convertType(r);

  if (r.default !== undefined) {
    schema.default = r.default;
  }

  return { schema, optional };
}

function parseShorthand(rule: string): Record<string, unknown> {
  const [type, ...flags] = rule.split('|').map((s) => s.trim());
  const out: Record<string, unknown> = { type };
  for (const flag of flags) {
    const [key, value] = flag.split(':');
    out[key] = value === undefined ? true : coerce(value);
  }
  return out;
}

function coerce(value: string): unknown {
  if (value === 'true') return true;
  if (value === 'false') return false;
  const num = Number(value);
  return Number.isNaN(num) ? value : num;
}

function convertType(r: Record<string, any>): SchemaObject {
  switch (r.type) {
    case 'string':
    case 'email':
    case 'url':
    case 'uuid':
    case 'objectID': {
      const schema: SchemaObject = { type: 'string' };
      if (typeof r.min === 'number') schema.minLength = r.min;
      if (typeof r.max === 'number') schema.maxLength = r.max;
      if (typeof r.length === 'number') {
        schema.minLength = r.length;
        schema.maxLength = r.length;
      }
      if (r.type === 'email') schema.format = 'email';
      if (r.type === 'url') schema.format = 'uri';
      if (r.type === 'uuid') schema.format = 'uuid';
      if (Array.isArray(r.enum)) schema.enum = r.enum;
      return schema;
    }
    case 'number': {
      const schema: SchemaObject = { type: r.integer ? 'integer' : 'number' };
      if (typeof r.min === 'number') schema.minimum = r.min;
      if (typeof r.max === 'number') schema.maximum = r.max;
      if (r.positive) schema.exclusiveMinimum = 0;
      return schema;
    }
    case 'boolean':
      return { type: 'boolean' };
    case 'date':
      return { type: 'string', format: 'date-time' };
    case 'enum':
      return { enum: Array.isArray(r.values) ? r.values : [] };
    case 'array': {
      const schema: SchemaObject = { type: 'array' };
      if (r.items !== undefined) {
        schema.items = convertRule(r.items).schema;
      }
      if (typeof r.min === 'number') schema.minItems = r.min;
      if (typeof r.max === 'number') schema.maxItems = r.max;
      return schema;
    }
    case 'object': {
      if (r.props && _.isPlainObject(r.props)) {
        return convertParams(r.props);
      }
      return { type: 'object' };
    }
    case 'any':
    case 'multi':
    case 'custom':
    default:
      return {};
  }
}
