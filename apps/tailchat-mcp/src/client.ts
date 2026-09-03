// A thin HTTP client for the Tailchat gateway.
//
// Every published Moleculer action is `POST /api/<service>/<action>` with a JSON body
// and a `{ code, data }` envelope. Authentication is the OpenApp API key (`tck_...`)
// sent as a bearer token; the gateway resolves it to the app's bot user and enforces the
// key's scopes before the action runs, so a 403 here is the server saying "not in
// scope" and must be relayed, not worked around.

import { ACTIONS, type ActionInfo } from './actions.js';

export interface TailchatConfig {
  /** Origin of the deployment, e.g. https://chat.example.com (no trailing slash). */
  url: string;
  /** OpenApp API key from the Open Api panel, `tck_` + 44 chars. */
  apiKey: string;
  timeoutMs: number;
}

export class ConfigError extends Error {}

const API_KEY_RE = /^tck_[A-Za-z0-9]{44}$/;

export function loadConfig(
  env: Record<string, string | undefined> = process.env
): TailchatConfig {
  const url = (env.TAILCHAT_URL ?? '').trim().replace(/\/+$/, '');
  const apiKey = (env.TAILCHAT_API_KEY ?? '').trim();
  if (!url) {
    throw new ConfigError(
      'TAILCHAT_URL is not set — the origin of the Tailchat deployment, e.g. https://chat.example.com'
    );
  }
  if (!/^https?:\/\//.test(url)) {
    throw new ConfigError(
      `TAILCHAT_URL must start with http:// or https:// (got "${url}")`
    );
  }
  if (!apiKey) {
    throw new ConfigError(
      'TAILCHAT_API_KEY is not set — create one under Open Api > your app > API keys and pass it in the environment'
    );
  }
  if (!API_KEY_RE.test(apiKey)) {
    throw new ConfigError(
      'TAILCHAT_API_KEY does not look like a Tailchat API key (expected tck_ followed by 44 alphanumerics)'
    );
  }
  const timeoutMs = Number(env.TAILCHAT_TIMEOUT_MS ?? 15000);
  if (!Number.isFinite(timeoutMs) || timeoutMs <= 0) {
    throw new ConfigError(
      'TAILCHAT_TIMEOUT_MS must be a positive number of milliseconds'
    );
  }
  return { url, apiKey, timeoutMs };
}

const actionsByName = new Map(ACTIONS.map((a) => [a.action, a]));

export function findAction(action: string): ActionInfo | undefined {
  return actionsByName.get(action);
}

const ACTION_RE = /^[A-Za-z0-9_:.-]+$/;

/**
 * Map a Moleculer action name to its gateway path. Known actions use the path from the
 * catalog; unknown ones (a plugin added after the catalog was generated) follow the
 * gateway's rule: core service names are dotted and every dot becomes a slash, plugin
 * services (`plugin:com.example.thing`) keep their dots and only the final segment,
 * the action, is split off.
 */
export function actionToPath(action: string): string {
  if (!ACTION_RE.test(action)) {
    throw new Error(`invalid action name "${action}"`);
  }
  const known = findAction(action);
  if (known) return known.path;
  if (action.startsWith('plugin:')) {
    const dot = action.lastIndexOf('.');
    if (dot < 0) {
      throw new Error(`plugin action "${action}" has no action segment`);
    }
    return `/${action.slice(0, dot)}/${action.slice(dot + 1)}`;
  }
  return '/' + action.replace(/\./g, '/');
}

export class TailchatApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly action: string,
    public readonly type?: string,
    public readonly data?: unknown
  ) {
    super(message);
    this.name = 'TailchatApiError';
  }
}

export type FetchLike = (input: string, init: RequestInit) => Promise<Response>;

export class TailchatClient {
  constructor(
    readonly config: TailchatConfig,
    private readonly fetchImpl: FetchLike = (input, init) => fetch(input, init)
  ) {}

  /**
   * Call a published action. Returns the `data` half of the envelope; throws
   * TailchatApiError with the gateway's status, type and message otherwise.
   */
  async call<T = unknown>(
    action: string,
    params: Record<string, unknown> = {}
  ): Promise<T> {
    const path = actionToPath(action);
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.config.timeoutMs);
    let res: Response;
    try {
      res = await this.fetchImpl(`${this.config.url}/api${path}`, {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          accept: 'application/json',
          authorization: `Bearer ${this.config.apiKey}`,
        },
        body: JSON.stringify(params),
        signal: controller.signal,
      });
    } catch (err) {
      const reason =
        err instanceof Error && err.name === 'AbortError'
          ? `timed out after ${this.config.timeoutMs} ms`
          : err instanceof Error
          ? err.message
          : String(err);
      throw new TailchatApiError(
        `${action}: request failed (${reason})`,
        0,
        action
      );
    } finally {
      clearTimeout(timer);
    }

    const text = await res.text();
    let body: any = undefined;
    if (text) {
      try {
        body = JSON.parse(text);
      } catch {
        body = undefined;
      }
    }

    if (!res.ok) {
      const message =
        (body && typeof body.message === 'string' && body.message) ||
        `${res.status} ${res.statusText}`;
      const detail = String(body?.data?.error ?? '');
      const hint =
        res.status === 403 && /scope/i.test(detail + message)
          ? ' — the API key does not carry a scope that permits this action; ask the app owner for a key with the right scope'
          : res.status === 401
          ? ' — the API key was rejected (revoked, expired, or the app lost its bot capability)'
          : res.status === 429
          ? ' — rate limited by the gateway; slow down and retry'
          : '';
      throw new TailchatApiError(
        `${action}: ${message}${
          detail && detail !== message ? ` (${detail})` : ''
        }${hint}`,
        res.status,
        action,
        body?.type,
        body?.data
      );
    }

    if (body && typeof body === 'object' && 'data' in body) {
      return body.data as T;
    }
    return body as T;
  }
}
