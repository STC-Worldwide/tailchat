import crypto from 'crypto';
import type { IncomingHttpHeaders } from 'http';

function headerValue(
  header: string | string[] | undefined
): string | undefined {
  return Array.isArray(header) ? header[0] : header;
}

/**
 * The credential presented on an HTTP request, in order of precedence:
 * `X-Token` (the web client), `Authorization: Bearer <value>`, `X-Api-Key`.
 *
 * Returns the raw value; whether it is a JWT or an API key is decided by the
 * caller (see gateway `resolveCredential`).
 */
export function extractCredential(
  headers: IncomingHttpHeaders
): string | undefined {
  const xToken = headerValue(headers['x-token'])?.trim();
  if (xToken) {
    return xToken;
  }

  const authorization = headerValue(headers['authorization'])?.trim();
  if (authorization) {
    const match = /^Bearer\s+(.+)$/i.exec(authorization);
    if (match && match[1].trim()) {
      return match[1].trim();
    }
  }

  const apiKey = headerValue(headers['x-api-key'])?.trim();
  if (apiKey) {
    return apiKey;
  }

  return undefined;
}

/**
 * Rate-limit bucket for a request: the hashed credential when there is one,
 * else the client IP. Hashing keeps raw tokens out of the limiter's store.
 */
export function buildRateLimitKey(
  headers: IncomingHttpHeaders,
  ip: string | undefined
): string {
  const credential = extractCredential(headers);
  if (credential) {
    const digest = crypto
      .createHash('sha256')
      .update(credential)
      .digest('hex')
      .slice(0, 32);
    return `c:${digest}`;
  }

  return `ip:${ip ?? 'unknown'}`;
}
